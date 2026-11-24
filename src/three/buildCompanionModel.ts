import * as THREE from 'three';
import type { FaceConfig, MoodState } from '../game/companionTypes';
import {
  createFurAlbedoTexture,
  createFurBumpTexture,
  createIrisTexture,
} from './proceduralTextures';

export interface CompanionRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  jawGroup: THREE.Group;
  muzzleGroup: THREE.Group;
  cheekLeft: THREE.Mesh;
  cheekRight: THREE.Mesh;
  noseMesh: THREE.Mesh;
  earLeftPivot: THREE.Group;
  earRightPivot: THREE.Group;
  earLeftPointedMesh: THREE.Mesh;
  earRightPointedMesh: THREE.Mesh;
  earLeftRabbitMesh: THREE.Mesh;
  earRightRabbitMesh: THREE.Mesh;
  earLeftInner: THREE.Mesh;
  earRightInner: THREE.Mesh;
  earLeftTip: THREE.Mesh;
  earRightTip: THREE.Mesh;
  eyeLeftGroup: THREE.Group;
  eyeRightGroup: THREE.Group;
  irisLeft: THREE.Mesh;
  irisRight: THREE.Mesh;
  pupilLeft: THREE.Mesh;
  pupilRight: THREE.Mesh;
  eyelidUpperLeft: THREE.Mesh;
  eyelidUpperRight: THREE.Mesh;
  eyelidLowerLeft: THREE.Mesh;
  eyelidLowerRight: THREE.Mesh;
  browLeft: THREE.Mesh;
  browRight: THREE.Mesh;
  whiskerPairs: THREE.Group[];
  armLeftPivot: THREE.Group;
  armRightPivot: THREE.Group;
  tailPivot: THREE.Group;
  tailBushyGroup: THREE.Group;
  tailCottonMesh: THREE.Mesh;
  accessories: {
    aviators: THREE.Group;
    police_vest: THREE.Group;
    floral_tie: THREE.Group;
    knit_scarf: THREE.Group;
  };
  materials: {
    primaryFur: THREE.MeshPhysicalMaterial;
    secondaryFur: THREE.MeshPhysicalMaterial;
    innerEar: THREE.MeshStandardMaterial;
    nose: THREE.MeshPhysicalMaterial;
    irisLeft: THREE.MeshStandardMaterial;
    irisRight: THREE.MeshStandardMaterial;
    eyelid: THREE.MeshPhysicalMaterial;
    blush: THREE.MeshStandardMaterial;
  };
  blushLeft: THREE.Mesh;
  blushRight: THREE.Mesh;
  interactables: THREE.Object3D[];
  dispose: () => void;
}

function sculptSphere(
  radius: number,
  wSeg: number,
  hSeg: number,
  deform: (v: THREE.Vector3) => void
): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(radius, wSeg, hSeg);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    deform(v);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function makeWhiskerPair(mat: THREE.Material, yOffset: number, spread: number): THREE.Group {
  const group = new THREE.Group();
  for (const side of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.075, yOffset, 0.025),
      new THREE.Vector3(side * 0.21, yOffset + spread * 0.025, 0.03),
      new THREE.Vector3(side * 0.36, yOffset + spread * 0.04 - 0.02, -0.02),
    ]);
    const geo = new THREE.TubeGeometry(curve, 10, 0.0038, 5, false);
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
  }
  return group;
}

export function buildCompanionModel(
  initialConfig: FaceConfig,
  maxAnisotropy = 4
): CompanionRig {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const furBump = track(createFurBumpTexture(maxAnisotropy));
  let currentFurAlbedo = createFurAlbedoTexture(
    initialConfig.primaryFur,
    initialConfig.secondaryFur,
    initialConfig.coatPattern,
    maxAnisotropy
  );
  let currentSecondaryAlbedo = createFurAlbedoTexture(
    initialConfig.secondaryFur,
    initialConfig.primaryFur,
    'solid',
    maxAnisotropy
  );

  const primaryFurMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: currentFurAlbedo,
      bumpMap: furBump,
      bumpScale: 0.022,
      roughness: 0.78,
      metalness: 0.0,
      sheen: 0.75,
      sheenRoughness: 0.62,
      sheenColor: new THREE.Color(initialConfig.secondaryFur),
    })
  );

  const secondaryFurMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: currentSecondaryAlbedo,
      bumpMap: furBump,
      bumpScale: 0.018,
      roughness: 0.84,
      metalness: 0.0,
      sheen: 0.6,
      sheenRoughness: 0.68,
      sheenColor: new THREE.Color(0xf7efe4),
    })
  );

  const eyelidMat = track(primaryFurMat.clone());
  eyelidMat.map = currentFurAlbedo;

  const innerEarMat = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialConfig.innerEarColor),
      bumpMap: furBump,
      bumpScale: 0.01,
      roughness: 0.78,
      metalness: 0.0,
    })
  );

  const darkTipMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x231e1d,
      bumpMap: furBump,
      bumpScale: 0.016,
      roughness: 0.82,
      sheen: 0.4,
    })
  );

  const noseMat = track(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(initialConfig.noseColor),
      roughness: 0.22,
      metalness: 0.02,
      clearcoat: 0.75,
      clearcoatRoughness: 0.14,
      bumpMap: furBump,
      bumpScale: 0.005,
    })
  );

  const scleraMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xf4f0e8,
      roughness: 0.16,
      metalness: 0.0,
      clearcoat: 0.5,
      clearcoatRoughness: 0.1,
    })
  );

  let irisLeftTex = createIrisTexture(initialConfig.eyeColorLeft, maxAnisotropy);
  let irisRightTex = createIrisTexture(initialConfig.eyeColorRight, maxAnisotropy);

  const irisLeftMat = track(
    new THREE.MeshStandardMaterial({
      map: irisLeftTex,
      roughness: 0.25,
      metalness: 0.04,
    })
  );
  const irisRightMat = track(
    new THREE.MeshStandardMaterial({
      map: irisRightTex,
      roughness: 0.25,
      metalness: 0.04,
    })
  );

  const pupilMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x07080b,
    })
  );

  const corneaMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.03,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    })
  );

  const blushMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xd94848,
      roughness: 0.85,
      transparent: true,
      opacity: 0.0,
    })
  );

  const root = new THREE.Group();
  root.position.set(0, 0, 0);

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const interactables: THREE.Object3D[] = [];
  const markHitZone = (obj: THREE.Object3D, zone: string) => {
    obj.userData.hitZone = zone;
    obj.layers.enable(1);
    interactables.push(obj);
  };

  // --- FEET / BOOTS (bottom-center grounded at y = 0) ---
  const footGeo = track(
    sculptSphere(0.145, 20, 14, (v) => {
      v.x *= 0.82;
      v.y *= 0.5;
      v.z *= 1.48;
      if (v.y < 0) v.y *= 0.32;
    })
  );
  const shoeMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x26211f,
      roughness: 0.45,
      metalness: 0.1,
    })
  );
  for (const side of [-1, 1]) {
    const foot = new THREE.Mesh(footGeo, shoeMat);
    foot.position.set(side * 0.17, 0.028, 0.07);
    foot.castShadow = true;
    foot.receiveShadow = true;
    markHitZone(foot, 'paw');
    bodyGroup.add(foot);
  }

  // --- LEGS & TAILORED TROUSERS ---
  const trouserMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x2c3545,
      roughness: 0.84,
      metalness: 0.02,
    })
  );
  const legGeo = track(new THREE.CapsuleGeometry(0.105, 0.32, 8, 16));
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, trouserMat);
    leg.position.set(side * 0.165, 0.28, 0.0);
    leg.castShadow = true;
    bodyGroup.add(leg);
  }

  // --- SCULPTED TORSO & COLLARED SHIRT ---
  const shirtMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x7e9d86,
      roughness: 0.82,
      sheen: 0.3,
      sheenRoughness: 0.72,
    })
  );
  const torsoGeo = track(
    sculptSphere(0.32, 28, 22, (v) => {
      v.y *= 1.36;
      v.z *= 0.76;
      // Athletic Zootopia jacket-shirt silhouette: broader shoulders, tapered waist
      if (v.y > 0.08) v.x *= 1.06;
      else if (v.y < -0.05) v.x *= 0.94;
    })
  );
  const torso = new THREE.Mesh(torsoGeo, shirtMat);
  torso.position.set(0, 0.8, 0);
  torso.castShadow = true;
  torso.receiveShadow = true;
  markHitZone(torso, 'belly');
  bodyGroup.add(torso);

  // Shirt Collar V-neck detail
  const collarShape = new THREE.Shape();
  collarShape.moveTo(-0.14, 0.05);
  collarShape.lineTo(0, -0.08);
  collarShape.lineTo(0.14, 0.05);
  collarShape.lineTo(0.18, 0.01);
  collarShape.lineTo(0, -0.13);
  collarShape.lineTo(-0.18, 0.01);
  collarShape.closePath();
  const collarGeo = track(
    new THREE.ExtrudeGeometry(collarShape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
    })
  );
  const collar = new THREE.Mesh(collarGeo, shirtMat);
  collar.position.set(0, 1.15, 0.17);
  collar.rotation.x = -0.35;
  bodyGroup.add(collar);

  // --- ARTICULATED ARMS & PAWS (natural shoulder slope + tapered forearm) ---
  const upperArmGeo = track(new THREE.CapsuleGeometry(0.072, 0.2, 8, 14));
  const forearmGeo = track(new THREE.CapsuleGeometry(0.062, 0.18, 8, 14));
  const pawGeo = track(
    sculptSphere(0.082, 18, 14, (v) => {
      v.x *= 0.88;
      v.y *= 1.12;
      v.z *= 0.78;
    })
  );
  const armLeftPivot = new THREE.Group();
  armLeftPivot.position.set(-0.33, 1.12, 0.0);
  const armRightPivot = new THREE.Group();
  armRightPivot.position.set(0.33, 1.12, 0.0);

  for (const [pivot, side] of [
    [armLeftPivot, -1],
    [armRightPivot, 1],
  ] as const) {
    const upper = new THREE.Mesh(upperArmGeo, shirtMat);
    upper.position.set(side * 0.035, -0.14, 0.01);
    upper.rotation.z = side * 0.16;
    upper.castShadow = true;
    pivot.add(upper);

    const fore = new THREE.Mesh(forearmGeo, primaryFurMat);
    fore.position.set(side * 0.055, -0.33, 0.045);
    fore.rotation.z = side * 0.06;
    fore.rotation.x = -0.18;
    fore.castShadow = true;
    pivot.add(fore);

    const paw = new THREE.Mesh(pawGeo, primaryFurMat);
    paw.position.set(side * 0.06, -0.45, 0.085);
    paw.castShadow = true;
    markHitZone(paw, 'paw');
    pivot.add(paw);
    bodyGroup.add(pivot);
  }

  // --- EXPRESSIVE TAIL ---
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.54, -0.22);
  bodyGroup.add(tailPivot);

  const tailBushyGroup = new THREE.Group();
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.06, -0.24),
    new THREE.Vector3(0, 0.26, -0.5),
    new THREE.Vector3(0, 0.48, -0.62),
  ]);
  const tailBaseGeo = track(new THREE.TubeGeometry(tailCurve, 22, 0.12, 14, false));
  const tPos = tailBaseGeo.attributes.position;
  for (let i = 0; i < tPos.count; i++) {
    const z = tPos.getZ(i);
    const t = Math.min(1, Math.max(0, -z / 0.62));
    const swell = Math.sin(t * Math.PI * 0.88) * 0.62 + 0.52;
    tPos.setX(i, tPos.getX(i) * swell);
  }
  tailBaseGeo.computeVertexNormals();
  const tailPlume = new THREE.Mesh(tailBaseGeo, primaryFurMat);
  tailPlume.castShadow = true;
  tailBushyGroup.add(tailPlume);

  const tailTipGeo = track(
    sculptSphere(0.13, 18, 14, (v) => {
      v.z *= 1.45;
    })
  );
  const tailTip = new THREE.Mesh(tailTipGeo, secondaryFurMat);
  tailTip.position.set(0, 0.44, -0.6);
  tailTip.rotation.x = 0.55;
  tailBushyGroup.add(tailTip);
  tailPivot.add(tailBushyGroup);

  const tailCottonGeo = track(new THREE.SphereGeometry(0.13, 18, 14));
  const tailCottonMesh = new THREE.Mesh(tailCottonGeo, secondaryFurMat);
  tailCottonMesh.position.set(0, 0.04, -0.05);
  tailCottonMesh.castShadow = true;
  tailPivot.add(tailCottonMesh);

  // --- NECK & SCULPTED HEAD ---
  const neckGeo = track(new THREE.CylinderGeometry(0.115, 0.145, 0.18, 18));
  const neck = new THREE.Mesh(neckGeo, primaryFurMat);
  neck.position.set(0, 1.24, 0);
  bodyGroup.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.52, 0.02);
  bodyGroup.add(headGroup);

  // Sculpted Cranium with realistic cheekbones, brow ridge, and narrower chin
  const craniumGeo = track(
    sculptSphere(0.39, 36, 28, (v) => {
      v.x *= 1.05;
      v.y *= 0.94;
      v.z *= 1.02;
      if (v.y > 0.1 && v.z > 0.1) {
        v.z -= (v.y - 0.1) * 0.24;
      }
      if (v.y < -0.1) {
        v.x *= 0.88;
      }
      if (v.z > 0.2 && v.y > -0.01 && v.y < 0.16 && Math.abs(v.x) > 0.07 && Math.abs(v.x) < 0.25) {
        v.z -= 0.026;
      }
    })
  );
  const cranium = new THREE.Mesh(craniumGeo, primaryFurMat);
  cranium.castShadow = true;
  cranium.receiveShadow = true;
  markHitZone(cranium, 'head');
  headGroup.add(cranium);

  // Tapered Sleek Furred Cheek Tufts (angled back seamlessly like a real fox/rabbit jaw)
  const cheekGeo = track(
    sculptSphere(0.165, 24, 18, (v) => {
      v.x *= 1.28;
      v.y *= 0.68;
      v.z *= 0.88;
      if (v.x > 0) v.y -= v.x * 0.14;
    })
  );
  const cheekLeft = new THREE.Mesh(cheekGeo, secondaryFurMat);
  cheekLeft.position.set(-0.24, -0.115, 0.14);
  cheekLeft.rotation.z = -0.22;
  cheekLeft.rotation.y = 0.26;
  cheekLeft.castShadow = true;
  markHitZone(cheekLeft, 'head');

  const cheekRight = new THREE.Mesh(cheekGeo, secondaryFurMat);
  cheekRight.position.set(0.24, -0.115, 0.14);
  cheekRight.rotation.z = 0.22;
  cheekRight.rotation.y = -0.26;
  cheekRight.castShadow = true;
  markHitZone(cheekRight, 'head');
  headGroup.add(cheekLeft, cheekRight);

  // Anger/Embarrassment Blush overlays
  const blushGeo = track(new THREE.SphereGeometry(0.072, 12, 10));
  const blushLeft = new THREE.Mesh(blushGeo, blushMat);
  blushLeft.position.set(-0.22, -0.035, 0.32);
  blushLeft.scale.set(1.15, 0.6, 0.28);
  const blushRight = new THREE.Mesh(blushGeo, blushMat);
  blushRight.position.set(0.22, -0.035, 0.32);
  blushRight.scale.set(1.15, 0.6, 0.28);
  headGroup.add(blushLeft, blushRight);

  // --- MUZZLE & ARTICULATED JAW ---
  const muzzleGroup = new THREE.Group();
  muzzleGroup.position.set(0, -0.085, 0.3);
  headGroup.add(muzzleGroup);

  const snoutBridgeGeo = track(
    sculptSphere(0.145, 24, 18, (v) => {
      v.x *= 0.78;
      v.y *= 0.66;
      v.z *= 1.48;
      if (v.z > 0) {
        const taper = Math.min(0.45, v.z * 0.32);
        v.x *= 1 - taper;
        v.y *= 1 - taper * 0.65;
      }
    })
  );
  const snoutBridge = new THREE.Mesh(snoutBridgeGeo, primaryFurMat);
  snoutBridge.position.set(0, 0.048, 0.05);
  snoutBridge.castShadow = true;
  muzzleGroup.add(snoutBridge);

  // Subtle upper lip whisker pads
  const padGeo = track(
    sculptSphere(0.085, 20, 14, (v) => {
      v.x *= 1.02;
      v.y *= 0.72;
      v.z *= 1.22;
    })
  );
  for (const side of [-1, 1]) {
    const pad = new THREE.Mesh(padGeo, secondaryFurMat);
    pad.position.set(side * 0.056, -0.008, 0.11);
    pad.castShadow = true;
    muzzleGroup.add(pad);
  }

  // Sculpted Wet Nose Leather
  const noseGeo = track(
    sculptSphere(0.052, 20, 14, (v) => {
      v.x *= 1.22;
      v.y *= 0.82;
      v.z *= 0.9;
      if (v.y < 0) v.x *= 0.62;
    })
  );
  const noseMesh = new THREE.Mesh(noseGeo, noseMat);
  noseMesh.position.set(0, 0.048, 0.235);
  noseMesh.castShadow = true;
  markHitZone(noseMesh, 'nose');
  muzzleGroup.add(noseMesh);

  // Articulated Lower Jaw + Mouth Interior
  const jawGroup = new THREE.Group();
  jawGroup.position.set(0, -0.038, 0.02);
  muzzleGroup.add(jawGroup);

  const mouthCavityMat = track(
    new THREE.MeshStandardMaterial({ color: 0x3b1216, roughness: 0.6 })
  );
  const cavity = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.075, 16, 12)),
    mouthCavityMat
  );
  cavity.position.set(0, 0.022, 0.075);
  cavity.scale.set(1.12, 0.48, 1.0);
  jawGroup.add(cavity);

  const tongueMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xd46a76,
      roughness: 0.35,
      clearcoat: 0.4,
    })
  );
  const tongue = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.05, 14, 10)),
    tongueMat
  );
  tongue.position.set(0, 0.014, 0.105);
  tongue.scale.set(1.0, 0.34, 1.3);
  jawGroup.add(tongue);

  const chinGeo = track(
    sculptSphere(0.092, 20, 14, (v) => {
      v.x *= 0.88;
      v.y *= 0.52;
      v.z *= 1.24;
    })
  );
  const chin = new THREE.Mesh(chinGeo, secondaryFurMat);
  chin.position.set(0, -0.02, 0.095);
  jawGroup.add(chin);

  // 3D Whisker pairs
  const whiskerMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xf4efe8,
      roughness: 0.32,
    })
  );
  const whiskerPairs: THREE.Group[] = [
    makeWhiskerPair(whiskerMat, 0.018, 0.35),
    makeWhiskerPair(whiskerMat, -0.002, 0.0),
    makeWhiskerPair(whiskerMat, -0.02, -0.32),
  ];
  whiskerPairs.forEach((wp) => {
    wp.position.set(0, 0.0, 0.125);
    muzzleGroup.add(wp);
  });

  // --- HYPER-REALISTIC MULTI-LAYER EYES (Z-depth fixed so sclera NEVER pokes through pupil!) ---
  const createEyeAssembly = (irisMaterial: THREE.Material) => {
    const group = new THREE.Group();

    // Flatten the front pole of the sclera at z = 0.076 so iris (0.080) and pupil (0.082) sit cleanly in front!
    const scleraGeo = track(
      sculptSphere(0.092, 24, 18, (v) => {
        v.x *= 1.0;
        v.y *= 1.04;
        v.z *= 0.9;
        if (v.z > 0.068) {
          v.z = 0.068 + (v.z - 0.068) * 0.25;
        }
      })
    );
    const sclera = new THREE.Mesh(scleraGeo, scleraMat);
    group.add(sclera);

    const irisGeo = track(new THREE.CircleGeometry(0.056, 28));
    const iris = new THREE.Mesh(irisGeo, irisMaterial);
    iris.position.set(0, 0, 0.081);
    group.add(iris);

    const pupilGeo = track(new THREE.CircleGeometry(0.054, 24));
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(0, 0, 0.083);
    pupil.scale.setScalar(initialConfig.pupilSize);
    group.add(pupil);

    // Specular pinpoint catchlight dot on cornea
    const glint = new THREE.Mesh(
      track(new THREE.CircleGeometry(0.011, 12)),
      track(new THREE.MeshBasicMaterial({ color: 0xffffff }))
    );
    glint.position.set(0.02, 0.022, 0.088);
    group.add(glint);

    const corneaGeo = track(
      new THREE.SphereGeometry(0.096, 24, 18, 0, Math.PI * 2, 0, Math.PI)
    );
    const cornea = new THREE.Mesh(corneaGeo, corneaMat);
    cornea.scale.set(1.0, 1.04, 0.95);
    group.add(cornea);

    // Upper & Lower Articulated Eyelids
    const lidUpperGeo = track(
      new THREE.SphereGeometry(0.101, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5)
    );
    const eyelidUpper = new THREE.Mesh(lidUpperGeo, eyelidMat);
    eyelidUpper.rotation.x = -0.38;
    group.add(eyelidUpper);

    const lidLowerGeo = track(
      new THREE.SphereGeometry(
        0.1,
        24,
        12,
        0,
        Math.PI * 2,
        Math.PI * 0.58,
        Math.PI * 0.42
      )
    );
    const eyelidLower = new THREE.Mesh(lidLowerGeo, eyelidMat);
    eyelidLower.rotation.x = 0.24;
    group.add(eyelidLower);

    return { group, iris, pupil, eyelidUpper, eyelidLower };
  };

  const leftEye = createEyeAssembly(irisLeftMat);
  const rightEye = createEyeAssembly(irisRightMat);
  leftEye.group.position.set(-0.145, 0.078, 0.322);
  rightEye.group.position.set(0.145, 0.078, 0.322);
  leftEye.group.rotation.y = -0.13;
  rightEye.group.rotation.y = 0.13;
  headGroup.add(leftEye.group, rightEye.group);

  // Articulated Furred Eyebrows
  const browGeo = track(
    sculptSphere(0.048, 16, 12, (v) => {
      v.x *= 2.05;
      v.y *= 0.38;
      v.z *= 0.68;
    })
  );
  const browLeft = new THREE.Mesh(browGeo, darkTipMat);
  browLeft.position.set(-0.148, 0.205, 0.335);
  const browRight = new THREE.Mesh(browGeo, darkTipMat);
  browRight.position.set(0.148, 0.205, 0.335);
  headGroup.add(browLeft, browRight);

  // --- SPECIES-SPECIFIC SCULPTED EARS (Pointed Fox/Fennec vs Tall Rabbit) ---
  const createEar = (side: -1 | 1) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.21, 0.3, -0.02);

    // 1. Sleek Triangular Fox/Fennec/Panda Ear
    const pointedGeo = track(
      sculptSphere(0.16, 22, 18, (v) => {
        v.x *= 0.92;
        v.y *= 1.8;
        v.z *= 0.32;
        // Triangular taper from wide base to crisp pointed tip
        const h = (v.y + 0.16 * 1.8) / (0.32 * 1.8); // 0 at base, 1 at tip
        const widthFactor = Math.max(0.12, 1.15 - h * 1.02);
        v.x *= widthFactor;
        v.z *= Math.max(0.25, 1.0 - h * 0.65);
        v.y += 0.24;
      })
    );
    const pointedMesh = new THREE.Mesh(pointedGeo, primaryFurMat);
    pointedMesh.castShadow = true;
    markHitZone(pointedMesh, 'ear');
    pivot.add(pointedMesh);

    // 2. Tall Graceful Rabbit Spoon Ear
    const rabbitGeo = track(
      sculptSphere(0.14, 22, 18, (v) => {
        v.x *= 0.62;
        v.y *= 2.55;
        v.z *= 0.28;
        const h = (v.y + 0.14 * 2.55) / (0.28 * 2.55);
        const swell = Math.sin(h * Math.PI * 0.85) * 0.45 + 0.62;
        v.x *= swell;
        v.y += 0.34;
      })
    );
    const rabbitMesh = new THREE.Mesh(rabbitGeo, primaryFurMat);
    rabbitMesh.castShadow = true;
    markHitZone(rabbitMesh, 'ear');
    pivot.add(rabbitMesh);

    const innerGeo = track(
      sculptSphere(0.095, 18, 14, (v) => {
        v.x *= 0.56;
        v.y *= 1.65;
        v.z *= 0.15;
        const h = (v.y + 0.095 * 1.65) / (0.19 * 1.65);
        v.x *= Math.max(0.18, 1.05 - h * 0.78);
        v.y += 0.22;
      })
    );
    const inner = new THREE.Mesh(innerGeo, innerEarMat);
    inner.position.set(0, 0.01, 0.036);
    pivot.add(inner);

    const tipGeo = track(
      sculptSphere(0.065, 14, 10, (v) => {
        v.x *= 0.6;
        v.y *= 1.3;
        v.z *= 0.35;
        if (v.y > 0) v.x *= 0.45;
      })
    );
    const tip = new THREE.Mesh(tipGeo, darkTipMat);
    tip.position.set(0, 0.46, 0.0);
    pivot.add(tip);

    return { pivot, pointedMesh, rabbitMesh, inner, tip };
  };

  const earL = createEar(-1);
  const earR = createEar(1);
  headGroup.add(earL.pivot, earR.pivot);

  // --- REALISTIC ACCESSORIES ---
  // 1. Aviator Sunglasses
  const aviators = new THREE.Group();
  const goldFrameMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.92,
      roughness: 0.18,
    })
  );
  const lensMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x162126,
      roughness: 0.08,
      metalness: 0.15,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.84,
    })
  );
  for (const side of [-1, 1]) {
    const rim = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.096, 0.007, 10, 26)),
      goldFrameMat
    );
    rim.position.set(side * 0.145, 0.078, 0.432);
    rim.rotation.y = side * 0.12;
    aviators.add(rim);

    const lens = new THREE.Mesh(
      track(new THREE.CircleGeometry(0.092, 24)),
      lensMat
    );
    lens.position.set(side * 0.145, 0.078, 0.433);
    lens.rotation.y = side * 0.12;
    aviators.add(lens);
  }
  const bridge = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.005, 0.005, 0.11, 8)),
    goldFrameMat
  );
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, 0.105, 0.442);
  aviators.add(bridge);
  headGroup.add(aviators);

  // 2. Zootopia Ranger/Police Vest + Brass Star Badge
  const police_vest = new THREE.Group();
  const vestMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x1e2c44,
      roughness: 0.72,
      metalness: 0.08,
    })
  );
  const vestGeo = track(
    sculptSphere(0.336, 26, 20, (v) => {
      v.y *= 1.18;
      v.z *= 0.79;
      if (v.y > 0.06) v.x *= 1.04;
    })
  );
  const vestMesh = new THREE.Mesh(vestGeo, vestMat);
  vestMesh.position.set(0, 0.81, 0.01);
  vestMesh.castShadow = true;
  police_vest.add(vestMesh);

  const badge = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.048, 0.048, 0.014, 6)),
    goldFrameMat
  );
  badge.rotation.x = Math.PI / 2;
  badge.position.set(0.14, 0.94, 0.265);
  police_vest.add(badge);
  bodyGroup.add(police_vest);

  // 3. Sculpted Beveled Silk Tie
  const floral_tie = new THREE.Group();
  const tieMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x264866,
      roughness: 0.38,
      sheen: 0.6,
    })
  );
  const knot = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.068, 0.056, 0.045)),
    tieMat
  );
  knot.position.set(0, 1.12, 0.215);
  knot.rotation.x = -0.15;

  const tieShape = new THREE.Shape();
  tieShape.moveTo(-0.025, 0);
  tieShape.lineTo(0.025, 0);
  tieShape.lineTo(0.048, -0.24);
  tieShape.lineTo(0, -0.31);
  tieShape.lineTo(-0.048, -0.24);
  tieShape.closePath();
  const tieBladeGeo = track(
    new THREE.ExtrudeGeometry(tieShape, {
      depth: 0.016,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 2,
    })
  );
  const blade = new THREE.Mesh(tieBladeGeo, tieMat);
  blade.position.set(0, 1.09, 0.22);
  blade.rotation.x = -0.08;
  floral_tie.add(knot, blade);
  bodyGroup.add(floral_tie);

  // 4. Cozy Knit Scarf
  const knit_scarf = new THREE.Group();
  const scarfMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xb84032,
      roughness: 0.92,
      sheen: 0.65,
    })
  );
  const scarfRing = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.19, 0.058, 14, 28)),
    scarfMat
  );
  scarfRing.position.set(0, 1.19, 0.02);
  scarfRing.rotation.x = Math.PI / 2 + 0.1;
  const scarfTail = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.095, 0.3, 0.036)),
    scarfMat
  );
  scarfTail.position.set(-0.13, 0.98, 0.22);
  scarfTail.rotation.z = -0.15;
  knit_scarf.add(scarfRing, scarfTail);
  bodyGroup.add(knit_scarf);

  const rig: CompanionRig = {
    root,
    bodyGroup,
    headGroup,
    jawGroup,
    muzzleGroup,
    cheekLeft,
    cheekRight,
    noseMesh,
    earLeftPivot: earL.pivot,
    earRightPivot: earR.pivot,
    earLeftPointedMesh: earL.pointedMesh,
    earRightPointedMesh: earR.pointedMesh,
    earLeftRabbitMesh: earL.rabbitMesh,
    earRightRabbitMesh: earR.rabbitMesh,
    earLeftInner: earL.inner,
    earRightInner: earR.inner,
    earLeftTip: earL.tip,
    earRightTip: earR.tip,
    eyeLeftGroup: leftEye.group,
    eyeRightGroup: rightEye.group,
    irisLeft: leftEye.iris,
    irisRight: rightEye.iris,
    pupilLeft: leftEye.pupil,
    pupilRight: rightEye.pupil,
    eyelidUpperLeft: leftEye.eyelidUpper,
    eyelidUpperRight: rightEye.eyelidUpper,
    eyelidLowerLeft: leftEye.eyelidLower,
    eyelidLowerRight: rightEye.eyelidLower,
    browLeft,
    browRight,
    whiskerPairs,
    armLeftPivot,
    armRightPivot,
    tailPivot,
    tailBushyGroup,
    tailCottonMesh,
    accessories: {
      aviators,
      police_vest,
      floral_tie,
      knit_scarf,
    },
    materials: {
      primaryFur: primaryFurMat,
      secondaryFur: secondaryFurMat,
      innerEar: innerEarMat,
      nose: noseMat,
      irisLeft: irisLeftMat,
      irisRight: irisRightMat,
      eyelid: eyelidMat,
      blush: blushMat,
    },
    blushLeft,
    blushRight,
    interactables,
    dispose: () => {
      currentFurAlbedo.dispose();
      currentSecondaryAlbedo.dispose();
      irisLeftTex.dispose();
      irisRightTex.dispose();
      disposables.forEach((d) => d.dispose());
    },
  };

  let lastFurKey = '';
  let lastEyeLKey = '';
  let lastEyeRKey = '';

  const applyConfig = (cfg: FaceConfig) => {
    const furKey = `${cfg.primaryFur}_${cfg.secondaryFur}_${cfg.coatPattern}`;
    if (furKey !== lastFurKey) {
      lastFurKey = furKey;
      const nextAlbedo = createFurAlbedoTexture(
        cfg.primaryFur,
        cfg.secondaryFur,
        cfg.coatPattern,
        maxAnisotropy
      );
      const nextSecAlbedo = createFurAlbedoTexture(
        cfg.secondaryFur,
        cfg.primaryFur,
        'solid',
        maxAnisotropy
      );
      currentFurAlbedo.dispose();
      currentSecondaryAlbedo.dispose();
      currentFurAlbedo = nextAlbedo;
      currentSecondaryAlbedo = nextSecAlbedo;
      primaryFurMat.map = nextAlbedo;
      primaryFurMat.needsUpdate = true;
      secondaryFurMat.map = nextSecAlbedo;
      secondaryFurMat.needsUpdate = true;
      eyelidMat.map = nextAlbedo;
      eyelidMat.needsUpdate = true;
    }

    primaryFurMat.sheen = cfg.furSheen;
    primaryFurMat.sheenColor.set(cfg.secondaryFur);
    innerEarMat.color.set(cfg.innerEarColor);
    noseMat.color.set(cfg.noseColor);

    if (cfg.eyeColorLeft !== lastEyeLKey) {
      lastEyeLKey = cfg.eyeColorLeft;
      const nextTex = createIrisTexture(cfg.eyeColorLeft, maxAnisotropy);
      irisLeftTex.dispose();
      irisLeftTex = nextTex;
      irisLeftMat.map = nextTex;
      irisLeftMat.needsUpdate = true;
    }
    if (cfg.eyeColorRight !== lastEyeRKey) {
      lastEyeRKey = cfg.eyeColorRight;
      const nextTex = createIrisTexture(cfg.eyeColorRight, maxAnisotropy);
      irisRightTex.dispose();
      irisRightTex = nextTex;
      irisRightMat.map = nextTex;
      irisRightMat.needsUpdate = true;
    }

    // Eye scale, spacing, pupil
    rig.eyeLeftGroup.scale.setScalar(cfg.eyeScale);
    rig.eyeRightGroup.scale.setScalar(cfg.eyeScale);
    rig.eyeLeftGroup.position.x = -0.145 * cfg.eyeSpacing;
    rig.eyeRightGroup.position.x = 0.145 * cfg.eyeSpacing;
    rig.pupilLeft.scale.setScalar(cfg.pupilSize);
    rig.pupilRight.scale.setScalar(cfg.pupilSize);

    // Muzzle & Cheeks
    rig.muzzleGroup.scale.set(1, 1, cfg.snoutLength);
    rig.cheekLeft.scale.setScalar(cfg.cheekPlumpness);
    rig.cheekRight.scale.setScalar(cfg.cheekPlumpness);

    // Brow thickness
    rig.browLeft.scale.set(1, cfg.browThickness, 1);
    rig.browRight.scale.set(1, cfg.browThickness, 1);

    // Whiskers
    rig.whiskerPairs.forEach((wp, idx) => {
      if (cfg.whiskerDensity <= 0.1) wp.visible = false;
      else if (cfg.whiskerDensity <= 0.65) wp.visible = idx < 2;
      else wp.visible = true;
    });

    // Species-specific ear shapes & proportions
    const isRabbit = cfg.species === 'rabbit';
    const isFennec = cfg.species === 'fennec';
    const isRedPanda = cfg.species === 'red_panda';

    rig.earLeftPointedMesh.visible = !isRabbit;
    rig.earRightPointedMesh.visible = !isRabbit;
    rig.earLeftRabbitMesh.visible = isRabbit;
    rig.earRightRabbitMesh.visible = isRabbit;

    const earWidth = isFennec ? 1.38 : isRabbit ? 0.92 : isRedPanda ? 1.15 : 1.05;
    const earHeight =
      (isRabbit ? 1.12 : isFennec ? 1.32 : isRedPanda ? 0.72 : 1.0) * cfg.earLength;

    rig.earLeftPivot.scale.set(earWidth, earHeight, 1);
    rig.earRightPivot.scale.set(earWidth, earHeight, 1);
    rig.earLeftInner.scale.set(1, isRabbit ? 1.3 : 1.0, 1);
    rig.earRightInner.scale.set(1, isRabbit ? 1.3 : 1.0, 1);
    rig.earLeftTip.visible = cfg.species === 'fox' || cfg.species === 'red_panda';
    rig.earRightTip.visible = cfg.species === 'fox' || cfg.species === 'red_panda';

    rig.tailCottonMesh.visible = isRabbit;
    rig.tailBushyGroup.visible = !isRabbit;

    // Accessories
    rig.accessories.aviators.visible = cfg.accessory === 'aviators';
    rig.accessories.police_vest.visible = cfg.accessory === 'police_vest';
    rig.accessories.floral_tie.visible = cfg.accessory === 'floral_tie';
    rig.accessories.knit_scarf.visible = cfg.accessory === 'knit_scarf';
  };

  applyConfig(initialConfig);
  (rig as CompanionRig & { applyConfig: (cfg: FaceConfig) => void }).applyConfig = applyConfig;

  return rig;
}

export function applyFacialExpression(
  rig: CompanionRig,
  config: FaceConfig,
  mood: MoodState,
  blinkWeight: number,
  mouthOpen: number,
  elapsed: number
) {
  let upperBase = -0.52;
  let lowerBase = 0.28;
  if (config.eyeStyle === 'slick') {
    upperBase = -0.22;
    lowerBase = 0.14;
  } else if (config.eyeStyle === 'wide') {
    upperBase = -0.68;
    lowerBase = 0.36;
  } else if (config.eyeStyle === 'sharp') {
    upperBase = -0.36;
    lowerBase = 0.12;
  }

  let browY = 0.205;
  let browTilt = 0.05;
  let earBaseZ = 0.22;
  let earDroopX = config.earDroop;
  let blushOpacity = 0;

  if (mood === 'curious') {
    upperBase -= 0.1;
    browY += 0.02;
    browTilt = 0.18;
    earBaseZ = 0.15;
  } else if (mood === 'teasing') {
    upperBase += 0.12;
    browTilt = 0.12;
    earDroopX += 0.1;
  } else if (mood === 'annoyed') {
    upperBase += 0.22;
    lowerBase -= 0.12;
    browY -= 0.02;
    browTilt = -0.22;
    earDroopX += 0.22;
    earBaseZ = 0.36;
    blushOpacity = 0.18;
  } else if (mood === 'angry') {
    upperBase += 0.3;
    lowerBase -= 0.18;
    browY -= 0.036;
    browTilt = -0.42;
    earDroopX += 0.42;
    earBaseZ = 0.56;
    blushOpacity = 0.42;
    rig.pupilLeft.scale.setScalar(Math.max(0.22, config.pupilSize * 0.72));
    rig.pupilRight.scale.setScalar(Math.max(0.22, config.pupilSize * 0.72));
  } else {
    rig.pupilLeft.scale.setScalar(config.pupilSize);
    rig.pupilRight.scale.setScalar(config.pupilSize);
  }

  const upperRot = THREE.MathUtils.lerp(upperBase, 0.14, blinkWeight);
  const lowerRot = THREE.MathUtils.lerp(lowerBase, -0.05, blinkWeight);

  rig.eyelidUpperLeft.rotation.x = upperRot;
  rig.eyelidUpperRight.rotation.x = upperRot;
  rig.eyelidLowerLeft.rotation.x = lowerRot;
  rig.eyelidLowerRight.rotation.x = lowerRot;

  rig.browLeft.position.y = browY;
  rig.browRight.position.y = browY;
  rig.browLeft.rotation.z = browTilt;
  rig.browRight.rotation.z = -browTilt;

  const twitch = Math.sin(elapsed * 2.4) * 0.03;
  rig.earLeftPivot.rotation.z = earBaseZ + twitch;
  rig.earRightPivot.rotation.z = -(earBaseZ + twitch * 0.7);
  rig.earLeftPivot.rotation.x = earDroopX;
  rig.earRightPivot.rotation.x = earDroopX;

  rig.materials.blush.opacity = THREE.MathUtils.lerp(
    rig.materials.blush.opacity,
    blushOpacity,
    0.15
  );

  rig.jawGroup.rotation.x = THREE.MathUtils.clamp(mouthOpen * 0.46, 0, 0.5);
}
