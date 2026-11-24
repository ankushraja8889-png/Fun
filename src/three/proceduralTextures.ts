import * as THREE from 'three';
import type { CoatPattern } from '../game/companionTypes';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

export function createFurAlbedoTexture(
  primaryHex: string,
  secondaryHex: string,
  pattern: CoatPattern,
  anisotropy = 4
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const p = hexToRgb(primaryHex);
  const s = hexToRgb(secondaryHex);

  // Base gradient coat
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, `rgb(${p.r},${p.g},${p.b})`);
  grad.addColorStop(0.75, `rgb(${clampByte(p.r * 0.92)},${clampByte(p.g * 0.92)},${clampByte(p.b * 0.92)})`);
  grad.addColorStop(1, `rgb(${clampByte(p.r * 0.84)},${clampByte(p.g * 0.84)},${clampByte(p.b * 0.84)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  if (pattern === 'tuxedo') {
    const chestGrad = ctx.createRadialGradient(size * 0.5, size * 0.65, 20, size * 0.5, size * 0.65, size * 0.34);
    chestGrad.addColorStop(0, `rgba(${s.r},${s.g},${s.b},0.92)`);
    chestGrad.addColorStop(0.7, `rgba(${s.r},${s.g},${s.b},0.35)`);
    chestGrad.addColorStop(1, `rgba(${s.r},${s.g},${s.b},0)`);
    ctx.fillStyle = chestGrad;
    ctx.fillRect(0, 0, size, size);
  } else if (pattern === 'tabby') {
    ctx.strokeStyle = `rgba(${clampByte(p.r * 0.55)},${clampByte(p.g * 0.52)},${clampByte(p.b * 0.5)},0.35)`;
    ctx.lineWidth = 14;
    for (let y = 36; y < size; y += 52) {
      ctx.beginPath();
      for (let x = 0; x <= size; x += 32) {
        const wave = Math.sin((x / size) * Math.PI * 4) * 10;
        if (x === 0) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }
  } else if (pattern === 'freckled') {
    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < 160; i++) {
      const fx = rand() * size;
      const fy = rand() * size;
      const r = 3 + rand() * 8;
      ctx.fillStyle =
        rand() > 0.45
          ? `rgba(${s.r},${s.g},${s.b},0.28)`
          : `rgba(${clampByte(p.r * 0.68)},${clampByte(p.g * 0.68)},${clampByte(p.b * 0.68)},0.22)`;
      ctx.beginPath();
      ctx.arc(fx, fy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Fine directional realistic guard-hair strands
  let seed = 4242;
  const rand = () => {
    seed = (seed * 48271) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  ctx.lineCap = 'round';
  for (let i = 0; i < 6500; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 8 + rand() * 18;
    const tilt = (rand() - 0.5) * 3.2;
    const shade = (rand() - 0.48) * 36;
    ctx.strokeStyle = `rgba(${clampByte(p.r + shade)},${clampByte(p.g + shade)},${clampByte(p.b + shade)},0.34)`;
    ctx.lineWidth = 0.7 + rand() * 1.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + tilt, y + len);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createFurBumpTexture(anisotropy = 4): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#7a7a7a';
  ctx.fillRect(0, 0, size, size);

  let seed = 9001;
  const rand = () => {
    seed = (seed * 48271) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  ctx.lineCap = 'round';
  for (let i = 0; i < 9000; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 7 + rand() * 16;
    const tilt = (rand() - 0.5) * 2.5;
    const lum = Math.floor(70 + rand() * 165);
    ctx.strokeStyle = `rgba(${lum},${lum},${lum},0.42)`;
    ctx.lineWidth = 0.6 + rand() * 1.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + tilt, y + len);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createIrisTexture(irisHex: string, anisotropy = 4): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = hexToRgb(irisHex);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  // Deep radial iris gradient
  const baseGrad = ctx.createRadialGradient(cx, cy, r * 0.14, cx, cy, r);
  baseGrad.addColorStop(0, `rgb(${clampByte(c.r * 1.25 + 25)},${clampByte(c.g * 1.15 + 15)},${clampByte(c.b * 0.9)})`);
  baseGrad.addColorStop(0.45, `rgb(${c.r},${c.g},${c.b})`);
  baseGrad.addColorStop(0.84, `rgb(${clampByte(c.r * 0.62)},${clampByte(c.g * 0.62)},${clampByte(c.b * 0.62)})`);
  baseGrad.addColorStop(1, `rgb(${clampByte(c.r * 0.22)},${clampByte(c.g * 0.22)},${clampByte(c.b * 0.22)})`);
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // Radial stroma fibers for realistic living eye look
  let seed = 5511;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 240; i++) {
    const angle = (i / 240) * Math.PI * 2 + (rand() - 0.5) * 0.04;
    const innerR = r * (0.2 + rand() * 0.14);
    const outerR = r * (0.76 + rand() * 0.18);
    const bright = rand() > 0.45 ? 1.38 : 0.68;
    ctx.strokeStyle = `rgba(${clampByte(c.r * bright)},${clampByte(c.g * bright)},${clampByte(c.b * bright)},0.38)`;
    ctx.lineWidth = 0.8 + rand() * 1.4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    ctx.stroke();
  }

  // Dark outer limbal ring
  ctx.strokeStyle = 'rgba(10, 12, 16, 0.72)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createWoodFloorTexture(anisotropy = 4): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#6f4c32';
  ctx.fillRect(0, 0, size, size);

  const plankHeight = 64;
  let seed = 881;
  const rand = () => {
    seed = (seed * 48271) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let row = 0; row < size / plankHeight; row++) {
    const y = row * plankHeight;
    const shift = (row % 2) * 128;
    for (let col = -1; col < 3; col++) {
      const x = col * 256 + shift;
      const tone = (rand() - 0.5) * 24;
      ctx.fillStyle = `rgb(${clampByte(115 + tone)},${clampByte(79 + tone * 0.7)},${clampByte(52 + tone * 0.5)})`;
      ctx.fillRect(x, y, 254, plankHeight - 2);

      // Wood grain streaks
      for (let g = 0; g < 18; g++) {
        const gy = y + 3 + rand() * (plankHeight - 8);
        ctx.strokeStyle = `rgba(42, 26, 15, ${0.08 + rand() * 0.14})`;
        ctx.lineWidth = 1 + rand() * 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 2, gy);
        ctx.lineTo(x + 252, gy + (rand() - 0.5) * 4);
        ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(22, 14, 9, 0.55)';
    ctx.fillRect(0, y + plankHeight - 2, size, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(8, 8, 12, 0.75)');
  grad.addColorStop(0.55, 'rgba(8, 8, 12, 0.32)');
  grad.addColorStop(1, 'rgba(8, 8, 12, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
