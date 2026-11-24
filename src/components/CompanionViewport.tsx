import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type {
  AnimationCue,
  EnvironmentId,
  FaceConfig,
  MoodState,
} from '../game/companionTypes';
import {
  applyFacialExpression,
  buildCompanionModel,
  type CompanionRig,
} from '../three/buildCompanionModel';
import { buildZootopiaEnvironment } from '../three/buildEnvironment';
import { soundEngine } from '../audio/soundEngine';

export type TouchZone = 'head' | 'nose' | 'ear' | 'belly' | 'paw';
export type CameraFocus = 'overview' | 'face';

interface CompanionViewportProps {
  gameState: 'title' | 'playing' | 'paused';
  faceConfig: FaceConfig;
  mood: MoodState;
  environment: EnvironmentId;
  cameraFocus: CameraFocus;
  actionCueSignal: { cue: AnimationCue; seq: number };
  particleBurstSignal: { kind: 'heart' | 'anger' | 'crumb'; seq: number };
  onTouchZone: (zone: TouchZone) => void;
}

interface ParticleSlot {
  active: boolean;
  life: number;
  maxLife: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  scale: number;
}

const _camTargetPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _curLook = new THREE.Vector3(0, 1.32, 0);
const _pointer = new THREE.Vector2(0, 0);
const _dummy = new THREE.Object3D();
const _pColor = new THREE.Color();

export function CompanionViewport({
  gameState,
  faceConfig,
  mood,
  environment,
  cameraFocus,
  actionCueSignal,
  particleBurstSignal,
  onTouchZone,
}: CompanionViewportProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Store live props in refs so WebGLRenderer mounts once and never resets
  const propsRef = useRef({
    gameState,
    faceConfig,
    mood,
    environment,
    cameraFocus,
    onTouchZone,
  });
  propsRef.current = {
    gameState,
    faceConfig,
    mood,
    environment,
    cameraFocus,
    onTouchZone,
  };

  const rigApplyRef = useRef<((cfg: FaceConfig) => void) | null>(null);
  const envSwitchRef = useRef<((env: EnvironmentId) => void) | null>(null);
  const cueStateRef = useRef<{ cue: AnimationCue; timer: number }>({
    cue: 'idle',
    timer: 0,
  });
  const burstQueueRef = useRef<Array<'heart' | 'anger' | 'crumb'>>([]);

  useEffect(() => {
    rigApplyRef.current?.(faceConfig);
  }, [faceConfig]);

  useEffect(() => {
    envSwitchRef.current?.(environment);
  }, [environment]);

  useEffect(() => {
    if (actionCueSignal.seq > 0) {
      cueStateRef.current = { cue: actionCueSignal.cue, timer: 1.15 };
    }
  }, [actionCueSignal]);

  useEffect(() => {
    if (particleBurstSignal.seq > 0) {
      burstQueueRef.current.push(particleBurstSignal.kind);
    }
  }, [particleBurstSignal]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);

    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTex = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    scene.environment = envTex;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 40);
    camera.position.set(0.65, 1.48, 3.35);
    camera.lookAt(_curLook);

    const maxAniso = isSoftwareGl
      ? 1
      : Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const envRig = buildZootopiaEnvironment(scene, isSoftwareGl, maxAniso);
    envRig.setEnvironment(propsRef.current.environment);
    envSwitchRef.current = envRig.setEnvironment;

    const rig = buildCompanionModel(propsRef.current.faceConfig, maxAniso) as CompanionRig & {
      applyConfig: (cfg: FaceConfig) => void;
    };
    scene.add(rig.root);
    rigApplyRef.current = rig.applyConfig;

    // Pooled InstancedMesh particles (hearts / anger embers / food crumbs)
    const PARTICLE_COUNT = 36;
    const pGeo = new THREE.OctahedronGeometry(0.04, 1);
    const pMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.1,
      emissive: 0x221100,
    });
    const particleMesh = new THREE.InstancedMesh(pGeo, pMat, PARTICLE_COUNT);
    particleMesh.frustumCulled = false;
    scene.add(particleMesh);

    const particles: ParticleSlot[] = Array.from(
      { length: PARTICLE_COUNT },
      () => ({
        active: false,
        life: 0,
        maxLife: 1,
        x: 0,
        y: -10,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        scale: 0,
      })
    );
    let pCursor = 0;

    const spawnBurst = (kind: 'heart' | 'anger' | 'crumb') => {
      const count = kind === 'anger' ? 14 : 10;
      const originY = kind === 'crumb' ? 1.42 : kind === 'anger' ? 1.85 : 1.72;
      for (let i = 0; i < count; i++) {
        const slot = particles[pCursor];
        pCursor = (pCursor + 1) % PARTICLE_COUNT;
        slot.active = true;
        slot.life = 0;
        slot.maxLife = 0.75 + Math.random() * 0.45;
        slot.x = (Math.random() - 0.5) * 0.45;
        slot.y = originY + (Math.random() - 0.5) * 0.15;
        slot.z = 0.35 + (Math.random() - 0.5) * 0.25;
        slot.vx = (Math.random() - 0.5) * 1.1;
        slot.vy = kind === 'crumb' ? 0.5 + Math.random() * 0.7 : 0.9 + Math.random() * 0.9;
        slot.vz = (Math.random() - 0.5) * 0.6;
        slot.scale = 0.7 + Math.random() * 0.6;

        if (kind === 'heart') _pColor.setHex(0xf472b6);
        else if (kind === 'anger') _pColor.setHex(0xef4444);
        else _pColor.setHex(0xf59e0b);
        particleMesh.setColorAt(
          (pCursor - 1 + PARTICLE_COUNT) % PARTICLE_COUNT,
          _pColor
        );
      }
      if (particleMesh.instanceColor) {
        particleMesh.instanceColor.needsUpdate = true;
      }
    };

    // Raycaster for direct 3D pet / boop / tickle interactions
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (propsRef.current.gameState !== 'playing') return;
      const rect = renderer.domElement.getBoundingClientRect();
      _pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_pointer, camera);
      const hits = raycaster.intersectObjects(rig.interactables, false);
      if (hits.length > 0) {
        const zone = (hits[0].object.userData.hitZone as TouchZone) || 'head';
        propsRef.current.onTouchZone(zone);
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsed = 0;
    let blinkTimer = 2.6;
    let blinkWeight = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const {
        gameState: gState,
        faceConfig: fCfg,
        mood: curMood,
        cameraFocus: camFocus,
      } = propsRef.current;

      if (gState !== 'paused') {
        elapsed += dt;
      }

      // Drain burst queue
      while (burstQueueRef.current.length > 0) {
        const nextKind = burstQueueRef.current.shift()!;
        spawnBurst(nextKind);
      }

      // Blinking rhythm
      blinkTimer -= dt;
      if (blinkTimer <= 0) {
        blinkTimer = 2.4 + Math.random() * 2.8;
      }
      const blinkTarget = blinkTimer < 0.14 ? 1 : 0;
      blinkWeight = THREE.MathUtils.damp(blinkWeight, blinkTarget, 22, dt);

      // Action cue decay
      if (cueStateRef.current.timer > 0) {
        cueStateRef.current.timer = Math.max(0, cueStateRef.current.timer - dt);
        if (cueStateRef.current.timer === 0) {
          cueStateRef.current.cue = 'idle';
        }
      }

      const activeCue = cueStateRef.current.cue;
      const cueProgress = 1 - cueStateRef.current.timer / 1.15;

      // Body & Head Procedural Motion
      const breath = Math.sin(elapsed * 2.1) * 0.015;
      let jumpY = 0;
      let tiltZ = 0;
      let headNodX = 0;
      let headYawY = THREE.MathUtils.clamp(_pointer.x * 0.24, -0.3, 0.3);
      let headLookX = THREE.MathUtils.clamp(-_pointer.y * 0.14, -0.2, 0.2);

      if (activeCue === 'happy_hop' || activeCue === 'giggle') {
        jumpY = Math.abs(Math.sin(cueProgress * Math.PI * 2)) * 0.14;
        tiltZ = Math.sin(cueProgress * Math.PI * 4) * 0.08;
      } else if (activeCue === 'boop_sneeze') {
        headNodX = Math.sin(cueProgress * Math.PI * 2) * -0.26;
        jumpY = Math.sin(cueProgress * Math.PI) * 0.05;
      } else if (activeCue === 'angry_stomp' || curMood === 'angry') {
        tiltZ = Math.sin(elapsed * 9) * (activeCue === 'angry_stomp' ? 0.06 : 0.02);
        headNodX = 0.09; // lowered aggressive glare
      } else if (activeCue === 'eat_treat') {
        headNodX = Math.sin(cueProgress * Math.PI * 5) * 0.1;
      }

      rig.bodyGroup.position.y = THREE.MathUtils.damp(
        rig.bodyGroup.position.y,
        jumpY + breath * 0.5,
        14,
        dt
      );
      rig.bodyGroup.rotation.z = THREE.MathUtils.damp(
        rig.bodyGroup.rotation.z,
        tiltZ,
        12,
        dt
      );

      // Squash & stretch lightly on hop
      const stretchY = 1 + jumpY * 0.4;
      const squashXZ = 1 / Math.sqrt(stretchY);
      rig.bodyGroup.scale.set(squashXZ, stretchY, squashXZ);

      // Head gaze tracking
      rig.headGroup.rotation.y = THREE.MathUtils.damp(
        rig.headGroup.rotation.y,
        gState === 'title' ? Math.sin(elapsed * 0.6) * 0.18 : headYawY,
        8,
        dt
      );
      rig.headGroup.rotation.x = THREE.MathUtils.damp(
        rig.headGroup.rotation.x,
        headLookX + headNodX,
        10,
        dt
      );

      // Arms pose (elbows flared on hips when angry, outward wave on wave cue, relaxed idle)
      let armLZ = -0.08;
      let armRZ = 0.08;
      let armLX = -0.06;
      let armRX = -0.06;
      if (activeCue === 'wave') {
        armRZ = 2.15 + Math.sin(elapsed * 11) * 0.28;
        armRX = -0.32;
      } else if (curMood === 'angry' || curMood === 'annoyed') {
        armLZ = -0.44;
        armRZ = 0.44;
        armLX = -0.34;
        armRX = -0.34;
      }
      rig.armLeftPivot.rotation.z = THREE.MathUtils.damp(rig.armLeftPivot.rotation.z, armLZ, 10, dt);
      rig.armRightPivot.rotation.z = THREE.MathUtils.damp(rig.armRightPivot.rotation.z, armRZ, 10, dt);
      rig.armLeftPivot.rotation.x = THREE.MathUtils.damp(rig.armLeftPivot.rotation.x, armLX, 10, dt);
      rig.armRightPivot.rotation.x = THREE.MathUtils.damp(rig.armRightPivot.rotation.x, armRX, 10, dt);

      // Tail wagging (fast when happy, stiff twitch when angry)
      const tailSpeed = curMood === 'angry' ? 9 : 3.2;
      const tailAmp = curMood === 'angry' ? 0.08 : 0.24;
      rig.tailPivot.rotation.y = Math.sin(elapsed * tailSpeed) * tailAmp;

      // Mouth lip-sync from Web Audio analyser or chewing cue
      const speechAmp = soundEngine.getMouthAmplitude();
      const chewAmp =
        activeCue === 'eat_treat' ? Math.abs(Math.sin(cueProgress * Math.PI * 6)) * 0.65 : 0;
      applyFacialExpression(
        rig,
        fCfg,
        curMood,
        blinkWeight,
        Math.max(speechAmp, chewAmp),
        elapsed
      );

      // Update pooled particles
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const slot = particles[i];
        if (!slot.active) {
          _dummy.position.set(0, -10, 0);
          _dummy.scale.setScalar(0);
          _dummy.updateMatrix();
          particleMesh.setMatrixAt(i, _dummy.matrix);
          continue;
        }
        slot.life += dt;
        if (slot.life >= slot.maxLife) {
          slot.active = false;
          _dummy.position.set(0, -10, 0);
          _dummy.scale.setScalar(0);
          _dummy.updateMatrix();
          particleMesh.setMatrixAt(i, _dummy.matrix);
          continue;
        }
        slot.x += slot.vx * dt;
        slot.y += slot.vy * dt;
        slot.z += slot.vz * dt;
        slot.vy -= 0.4 * dt;

        const fade = 1 - slot.life / slot.maxLife;
        _dummy.position.set(slot.x, slot.y, slot.z);
        _dummy.rotation.set(slot.life * 2, slot.life * 3, 0);
        _dummy.scale.setScalar(slot.scale * fade);
        _dummy.updateMatrix();
        particleMesh.setMatrixAt(i, _dummy.matrix);
      }
      particleMesh.instanceMatrix.needsUpdate = true;

      // Damped cinematic camera framing
      if (gState === 'title') {
        // Place character slightly right of center so left negative space holds title cleanly
        _camTargetPos.set(
          -0.68 + Math.sin(elapsed * 0.35) * 0.12,
          1.42 + Math.cos(elapsed * 0.45) * 0.04,
          3.48
        );
        _lookTarget.set(-0.44, 1.24, 0.05);
      } else if (camFocus === 'face') {
        _camTargetPos.set(0.0, 1.56, 1.95);
        _lookTarget.set(0.0, 1.54, 0.1);
      } else {
        _camTargetPos.set(_pointer.x * 0.12, 1.38 + _pointer.y * 0.06, 3.38);
        _lookTarget.set(0.0, 1.2, 0.0);
      }

      camera.position.x = THREE.MathUtils.damp(camera.position.x, _camTargetPos.x, 6, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _camTargetPos.y, 6, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _camTargetPos.z, 6, dt);
      _curLook.x = THREE.MathUtils.damp(_curLook.x, _lookTarget.x, 6, dt);
      _curLook.y = THREE.MathUtils.damp(_curLook.y, _lookTarget.y, 6, dt);
      _curLook.z = THREE.MathUtils.damp(_curLook.z, _lookTarget.z, 6, dt);
      camera.lookAt(_curLook);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      rig.dispose();
      envRig.dispose();
      pGeo.dispose();
      pMat.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="companion-viewport"
      className="fixed inset-0 w-full h-full z-0"
    />
  );
}
