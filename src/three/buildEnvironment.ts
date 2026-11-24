import * as THREE from 'three';
import type { EnvironmentId } from '../game/companionTypes';
import {
  createContactShadowTexture,
  createWoodFloorTexture,
} from './proceduralTextures';

export const ENVIRONMENT_META: Record<
  EnvironmentId,
  {
    label: string;
    backdropUrl: string;
    bgColor: number;
    fogColor: number;
    keyColor: number;
    keyIntensity: number;
    hemiSky: number;
    hemiGround: number;
    hemiIntensity: number;
    rimColor: number;
    rimIntensity: number;
  }
> = {
  golden_loft: {
    label: 'Savanna Plaza Loft',
    backdropUrl: '/src/assets/images/city_skyline_golden_1795521964361.jpg',
    bgColor: 0x261c17,
    fogColor: 0x3b2c22,
    keyColor: 0xffd7a8,
    keyIntensity: 2.35,
    hemiSky: 0xa8c8f0,
    hemiGround: 0x4d3424,
    hemiIntensity: 0.72,
    rimColor: 0xffb36b,
    rimIntensity: 1.35,
  },
  twilight_metro: {
    label: 'Downtown Twilight',
    backdropUrl: '/src/assets/images/city_skyline_twilight_1795521964425.jpg',
    bgColor: 0x101726,
    fogColor: 0x151e30,
    keyColor: 0xc2d8ff,
    keyIntensity: 1.85,
    hemiSky: 0x4f78c4,
    hemiGround: 0x1e2230,
    hemiIntensity: 0.78,
    rimColor: 0xf59e0b,
    rimIntensity: 1.55,
  },
  rainforest_terrace: {
    label: 'Rainforest Conservatory',
    backdropUrl: '/src/assets/images/rainforest_canopy_bg_1795521965049.jpg',
    bgColor: 0x15241c,
    fogColor: 0x1d3025,
    keyColor: 0xfff0cc,
    keyIntensity: 2.2,
    hemiSky: 0x89d6b3,
    hemiGround: 0x302b20,
    hemiIntensity: 0.85,
    rimColor: 0x7be3a6,
    rimIntensity: 1.15,
  },
};

export interface EnvironmentRig {
  group: THREE.Group;
  contactShadow: THREE.Mesh;
  keyLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  rimLight: THREE.DirectionalLight;
  lampLight: THREE.PointLight;
  setEnvironment: (envId: EnvironmentId) => void;
  dispose: () => void;
}

export function buildZootopiaEnvironment(
  scene: THREE.Scene,
  isSoftwareGl: boolean,
  maxAnisotropy = 4
): EnvironmentRig {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const group = new THREE.Group();
  scene.add(group);

  // --- LIGHTING RIG (3-point warm/cool contrast, <= 1 shadow caster) ---
  const hemiLight = new THREE.HemisphereLight(0xa8c8f0, 0x4d3424, 0.72);
  hemiLight.position.set(0, 8, 0);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffd7a8, 2.35);
  keyLight.position.set(3.4, 4.6, 4.2);
  keyLight.castShadow = !isSoftwareGl;
  if (!isSoftwareGl) {
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    const d = 3.2;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 16;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
  }
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xffb36b, 1.35);
  rimLight.position.set(-3.2, 3.0, -3.5);
  scene.add(rimLight);

  const lampLight = new THREE.PointLight(0xffbe78, 1.4, 7, 1.6);
  lampLight.position.set(-2.3, 2.15, -1.2);
  scene.add(lampLight);

  // --- FLOOR, RUG & CONTACT SHADOW (Y >= 0.02 separation) ---
  const woodTex = track(createWoodFloorTexture(maxAnisotropy));
  const floorMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: woodTex,
      roughness: 0.42,
      metalness: 0.04,
    })
  );
  const floorGeo = track(new THREE.PlaneGeometry(14, 10));
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.025;
  floor.receiveShadow = true;
  group.add(floor);

  // Plush woven circular rug under companion (sits at y = 0)
  const rugMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xd9cfc2,
      roughness: 0.94,
      sheen: 0.5,
      sheenRoughness: 0.85,
    })
  );
  const rugGeo = track(new THREE.CylinderGeometry(1.55, 1.58, 0.025, 48));
  const rug = new THREE.Mesh(rugGeo, rugMat);
  rug.position.set(0, -0.0125, 0.05);
  rug.receiveShadow = true;
  group.add(rug);

  // Soft radial contact shadow directly beneath companion
  const contactTex = track(createContactShadowTexture());
  const contactMat = track(
    new THREE.MeshBasicMaterial({
      map: contactTex,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    })
  );
  const contactShadow = new THREE.Mesh(
    track(new THREE.CircleGeometry(0.68, 32)),
    contactMat
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, 0.004, 0.02);
  group.add(contactShadow);

  // --- PANORAMIC ZOOTOPIA WINDOW & BACKDROP CURVE ---
  const backdropTextures = new Map<EnvironmentId, THREE.Texture>();
  const loader = new THREE.TextureLoader();

  const backdropMat = track(
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
    })
  );

  // Curved backdrop cyclorama behind the window
  const backdropGeo = track(
    new THREE.CylinderGeometry(7.2, 7.2, 6.2, 36, 1, true, Math.PI * 0.72, Math.PI * 0.56)
  );
  backdropGeo.scale(-1, 1, 1); // face inward toward camera
  const backdropMesh = new THREE.Mesh(backdropGeo, backdropMat);
  backdropMesh.position.set(0, 2.25, 1.8);
  group.add(backdropMesh);

  // Sleek Loft Window Frame + Mullions + Sill (creates real spatial depth)
  const frameMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x201d1c,
      roughness: 0.36,
      metalness: 0.58,
    })
  );
  const wallMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x2e2a28,
      roughness: 0.85,
      metalness: 0.02,
    })
  );

  // Lower apron wall beneath window
  const apron = new THREE.Mesh(
    track(new THREE.BoxGeometry(11, 0.72, 0.25)),
    wallMat
  );
  apron.position.set(0, 0.34, -2.55);
  apron.receiveShadow = true;
  group.add(apron);

  // Window Sill
  const sill = new THREE.Mesh(
    track(new THREE.BoxGeometry(11.2, 0.08, 0.38)),
    new THREE.MeshStandardMaterial({ color: 0x453428, roughness: 0.45 })
  );
  sill.position.set(0, 0.72, -2.5);
  group.add(sill);

  // Side walls framing the panoramic view
  for (const side of [-1, 1]) {
    const sideWall = new THREE.Mesh(
      track(new THREE.BoxGeometry(2.6, 5.2, 0.35)),
      wallMat
    );
    sideWall.position.set(side * 4.4, 2.55, -2.52);
    group.add(sideWall);

    const mullion = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.08, 4.2, 0.14)),
      frameMat
    );
    mullion.position.set(side * 1.65, 2.75, -2.5);
    group.add(mullion);
  }
  const topHeader = new THREE.Mesh(
    track(new THREE.BoxGeometry(11, 1.0, 0.35)),
    wallMat
  );
  topHeader.position.set(0, 4.75, -2.52);
  group.add(topHeader);

  // --- COMPOSITE 3D PROPS (3-12 parts each, grounded at y = -0.025) ---
  // 1. Mid-Century Brass Floor Lamp (Left)
  const lampGroup = new THREE.Group();
  lampGroup.position.set(-2.75, -0.025, -1.75);
  const brassMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xc99c4a,
      metalness: 0.85,
      roughness: 0.24,
    })
  );
  const lampBase = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.24, 0.26, 0.04, 24)),
    brassMat
  );
  lampBase.position.y = 0.02;
  const lampPole = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.025, 0.03, 2.05, 12)),
    brassMat
  );
  lampPole.position.y = 1.05;
  const lampShadeMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xf5ead6,
      emissive: 0xffb866,
      emissiveIntensity: 0.45,
      roughness: 0.72,
      side: THREE.DoubleSide,
    })
  );
  const lampShade = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.2, 0.34, 0.38, 24, 1, true)),
    lampShadeMat
  );
  lampShade.position.y = 2.15;
  lampGroup.add(lampBase, lampPole, lampShade);
  group.add(lampGroup);

  // 2. Botanical Monstera Plant in Ceramic Planter (Right)
  const plantGroup = new THREE.Group();
  plantGroup.position.set(2.05, -0.025, -1.45);
  const potMat = track(
    new THREE.MeshStandardMaterial({ color: 0xded6cc, roughness: 0.45 })
  );
  const pot = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.26, 0.19, 0.46, 22)),
    potMat
  );
  pot.position.y = 0.23;
  pot.castShadow = true;
  plantGroup.add(pot);

  const soil = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 18)),
    new THREE.MeshStandardMaterial({ color: 0x2b2017, roughness: 0.95 })
  );
  soil.position.y = 0.44;
  plantGroup.add(soil);

  const leafMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x2d6b41,
      roughness: 0.42,
      clearcoat: 0.25,
      side: THREE.DoubleSide,
    })
  );
  const leafGeo = track(new THREE.SphereGeometry(0.22, 12, 10));
  leafGeo.scale(1.0, 0.12, 1.6);
  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2;
    const stem = new THREE.Group();
    stem.position.set(0, 0.45, 0);
    stem.rotation.y = angle;
    stem.rotation.x = 0.38 + (i % 3) * 0.18;
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(0, 0.35 + (i % 2) * 0.15, 0.22);
    leaf.castShadow = true;
    stem.add(leaf);
    plantGroup.add(stem);
  }
  group.add(plantGroup);

  // 3. Modern Walnut Side Table with Ceramic Mug (Right Fore)
  const tableGroup = new THREE.Group();
  tableGroup.position.set(1.55, -0.025, -0.45);
  const walnutMat = track(
    new THREE.MeshStandardMaterial({ color: 0x4f3320, roughness: 0.48 })
  );
  const tableTop = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 24)),
    walnutMat
  );
  tableTop.position.y = 0.56;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  tableGroup.add(tableTop);

  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.02, 0.014, 0.56, 10)),
      walnutMat
    );
    leg.position.set(Math.cos(a) * 0.2, 0.28, Math.sin(a) * 0.2);
    leg.rotation.z = -Math.cos(a) * 0.1;
    leg.rotation.x = Math.sin(a) * 0.1;
    tableGroup.add(leg);
  }
  const mug = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.055, 0.05, 0.11, 16)),
    new THREE.MeshStandardMaterial({ color: 0xe67e22, roughness: 0.25 })
  );
  mug.position.set(0.06, 0.635, 0.04);
  tableGroup.add(mug);
  group.add(tableGroup);

  const setEnvironment = (envId: EnvironmentId) => {
    const meta = ENVIRONMENT_META[envId];
    scene.background = new THREE.Color(meta.bgColor);
    scene.fog = new THREE.FogExp2(meta.fogColor, 0.032);

    keyLight.color.setHex(meta.keyColor);
    keyLight.intensity = meta.keyIntensity;
    hemiLight.color.setHex(meta.hemiSky);
    hemiLight.groundColor.setHex(meta.hemiGround);
    hemiLight.intensity = meta.hemiIntensity;
    rimLight.color.setHex(meta.rimColor);
    rimLight.intensity = meta.rimIntensity;

    const cached = backdropTextures.get(envId);
    if (cached) {
      backdropMat.map = cached;
      backdropMat.needsUpdate = true;
    } else {
      loader.load(meta.backdropUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAnisotropy;
        backdropTextures.set(envId, tex);
        backdropMat.map = tex;
        backdropMat.needsUpdate = true;
      });
    }
  };

  setEnvironment('golden_loft');

  return {
    group,
    contactShadow,
    keyLight,
    hemiLight,
    rimLight,
    lampLight,
    setEnvironment,
    dispose: () => {
      backdropTextures.forEach((t) => t.dispose());
      disposables.forEach((d) => d.dispose());
    },
  };
}
