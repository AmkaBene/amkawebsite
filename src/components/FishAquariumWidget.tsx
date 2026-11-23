import {useEffect, useRef, useState, type PointerEvent} from 'react';
import {Plus, RotateCcw, Sparkles, Sun, Moon} from 'lucide-react';

type TankTheme = 'daylight' | 'twilight';
type Species = 'betta' | 'koi' | 'tetra' | 'clownfish' | 'tang';

interface Fish {
  id: number;
  species: Species;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  speedMult: number;
  targetX: number;
  targetY: number;
  hueShift: number;
}

interface Pellet {
  x: number;
  y: number;
  vy: number;
  vx: number;
  radius: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: string;
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
  wobble: number;
  fromVent: boolean;
}

interface SparkleWake {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  r: number;
}

type StarfishColor = 'coral' | 'peach' | 'aqua';

interface Starfish {
  id: number;
  x: number;
  dir: 1 | -1;
  speed: number;
  size: number;
  phase: number;
  wiggleBoost: number;
  color: StarfishColor;
}

function createFish(id: number, species: Species, w: number, h: number): Fish {
  const dir = Math.random() > 0.5 ? 1 : -1;
  const baseSize =
    species === 'koi'
      ? 28
      : species === 'betta'
        ? 24
        : species === 'tetra'
          ? 16
          : species === 'tang'
            ? 21
            : 20;

  return {
    id,
    species,
    x: 80 + Math.random() * Math.max(120, w - 160),
    y: 70 + Math.random() * Math.max(80, h - 165),
    vx: dir * (0.9 + Math.random() * 0.75),
    vy: (Math.random() - 0.5) * 0.35,
    size: baseSize + (Math.random() - 0.5) * 2.5,
    phase: Math.random() * Math.PI * 2,
    speedMult: species === 'tetra' ? 1.25 : species === 'betta' ? 0.88 : 1.0,
    targetX: 90 + Math.random() * Math.max(120, w - 180),
    targetY: 60 + Math.random() * Math.max(80, h - 140),
    hueShift: (Math.random() - 0.5) * 16,
  };
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface PolyFace {
  pts: Vec3[];
  rgb: [number, number, number];
  stroke?: string;
  doubleSided?: boolean;
  centerHint?: Vec3;
}

function rotateVec3(p: Vec3, rx: number, ry: number, rz: number): Vec3 {
  let {x, y, z} = p;
  if (rx !== 0) {
    const cx = Math.cos(rx);
    const sx = Math.sin(rx);
    const y1 = y * cx - z * sx;
    const z1 = y * sx + z * cx;
    y = y1;
    z = z1;
  }
  if (ry !== 0) {
    const cy = Math.cos(ry);
    const sy = Math.sin(ry);
    const x1 = x * cy + z * sy;
    const z1 = -x * sy + z * cy;
    x = x1;
    z = z1;
  }
  if (rz !== 0) {
    const cz = Math.cos(rz);
    const sz = Math.sin(rz);
    const x1 = x * cz - y * sz;
    const y1 = x * sz + y * cz;
    x = x1;
    y = y1;
  }
  return {x, y, z};
}

function createStarfish(
  id: number,
  w: number,
  color: StarfishColor = 'coral',
  xOverride?: number,
): Starfish {
  const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
  return {
    id,
    x: xOverride ?? 90 + Math.random() * Math.max(120, w - 180),
    dir,
    speed: 0.14 + Math.random() * 0.1,
    size: 15 + Math.random() * 4,
    phase: Math.random() * Math.PI * 2,
    wiggleBoost: 0,
    color,
  };
}

const STARFISH_RGB: Record<
  StarfishColor,
  {main: [number, number, number]; hi: [number, number, number]; rim: string; dot: string}
> = {
  coral: {main: [234, 88, 12], hi: [251, 146, 60], rim: '#7C2D12', dot: '#FEF3C7'},
  peach: {main: [225, 29, 72], hi: [253, 164, 175], rim: '#881337', dot: '#FFF1F2'},
  aqua: {main: [2, 132, 199], hi: [103, 232, 249], rim: '#0C4A6E', dot: '#ECFEFF'},
};

function drawStarfish64(
  ctx: CanvasRenderingContext2D,
  spriteCanvas: HTMLCanvasElement,
  star: Starfish,
  h: number,
  isDay: boolean,
  time: number,
) {
  const SPR_W = 48;
  const SPR_H = 38;
  if (spriteCanvas.width !== SPR_W || spriteCanvas.height !== SPR_H) {
    spriteCanvas.width = SPR_W;
    spriteCanvas.height = SPR_H;
  }
  const sctx = spriteCanvas.getContext('2d');
  if (!sctx) return;

  sctx.clearRect(0, 0, SPR_W, SPR_H);
  sctx.imageSmoothingEnabled = false;

  const pal = STARFISH_RGB[star.color];
  const floorY = h - 18 + Math.sin(star.x * 0.016) * 5;
  const rOuter = 17;
  const rInner = 7.2;
  const tilt = Math.sin(star.phase * 0.5) * 0.1 + star.dir * 0.08;

  // Compute 10 faceted N64 triangles meeting at a raised 3D central ridge apex
  const cx = SPR_W / 2;
  const cy = SPR_H / 2 + 2;
  const apex = {x: cx, y: cy - 4};

  const tips: {x: number; y: number; a: number}[] = [];
  const valleys: {x: number; y: number}[] = [];

  for (let i = 0; i < 5; i++) {
    const armFlex =
      Math.sin(time * 2.2 + star.phase + i * 1.3) * (0.07 + star.wiggleBoost * 0.14);
    const tipAngle = -Math.PI / 2 + (i * Math.PI * 2) / 5 + tilt + armFlex;
    const valAngle = -Math.PI / 2 + (i * Math.PI * 2) / 5 + Math.PI / 5 + tilt;
    tips.push({
      x: cx + Math.cos(tipAngle) * rOuter,
      y: cy + Math.sin(tipAngle) * rOuter * 0.68,
      a: tipAngle,
    });
    valleys.push({
      x: cx + Math.cos(valAngle) * rInner,
      y: cy + Math.sin(valAngle) * rInner * 0.68,
    });
  }

  // Soft chunky 64-bit ground shadow
  sctx.fillStyle = isDay ? 'rgba(7, 89, 133, 0.28)' : 'rgba(2, 12, 24, 0.5)';
  sctx.fillRect(Math.round(cx - 14), Math.round(cy + 6), 28, 5);

  // Draw 10 beveled facets (2 per arm: left slope & right slope for true N64 low-poly look)
  for (let i = 0; i < 5; i++) {
    const prevV = valleys[(i + 4) % 5];
    const tip = tips[i];
    const nextV = valleys[i];

    const lightA = Math.max(0.66, Math.min(1.12, 0.85 + Math.cos(tip.a + 0.8) * 0.25));
    const lightB = Math.max(0.56, Math.min(1.04, 0.75 + Math.cos(tip.a - 0.6) * 0.25));

    // Left arm slope facet
    sctx.fillStyle = `rgb(${Math.min(255, Math.round(pal.main[0] * lightA))},${Math.min(255, Math.round(pal.main[1] * lightA))},${Math.min(255, Math.round(pal.main[2] * lightA))})`;
    sctx.beginPath();
    sctx.moveTo(apex.x, apex.y);
    sctx.lineTo(prevV.x, prevV.y);
    sctx.lineTo(tip.x, tip.y);
    sctx.closePath();
    sctx.fill();
    sctx.strokeStyle = pal.rim;
    sctx.lineWidth = 0.8;
    sctx.stroke();

    // Right arm slope facet
    sctx.fillStyle = `rgb(${Math.min(255, Math.round(pal.hi[0] * lightB))},${Math.min(255, Math.round(pal.hi[1] * lightB))},${Math.min(255, Math.round(pal.hi[2] * lightB))})`;
    sctx.beginPath();
    sctx.moveTo(apex.x, apex.y);
    sctx.lineTo(tip.x, tip.y);
    sctx.lineTo(nextV.x, nextV.y);
    sctx.closePath();
    sctx.fill();
    sctx.stroke();
  }

  // Crunchy square 64-bit dorsal pixel studs
  sctx.fillStyle = pal.dot;
  sctx.fillRect(Math.round(apex.x - 1), Math.round(apex.y - 1), 2, 2);
  for (let i = 0; i < 5; i++) {
    const tip = tips[i];
    const mx = Math.round(apex.x + (tip.x - apex.x) * 0.5);
    const my = Math.round(apex.y + (tip.y - apex.y) * 0.5);
    sctx.fillRect(mx, my, 2, 2);
  }

  const dstScale = star.size / 14.5;
  const dstW = Math.round(SPR_W * dstScale);
  const dstH = Math.round(SPR_H * dstScale);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    spriteCanvas,
    Math.round(star.x - dstW / 2),
    Math.round(floorY - dstH * 0.52),
    dstW,
    dstH,
  );
  ctx.restore();
}

function getFishBodyFacetRgb(
  species: Species,
  segIdx: number,
  flankIdx: number, // 0: upper-right, 1: lower-right, 2: lower-left, 3: upper-left
): [number, number, number] {
  const isTop = flankIdx === 0 || flankIdx === 3;
  if (species === 'koi') {
    if (segIdx === 1 && isTop) return [239, 68, 68]; // Crimson Kohaku crown
    if (segIdx === 2 && !isTop) return [239, 68, 68]; // Crimson belly patch
    if (segIdx === 2 && flankIdx === 0) return [30, 41, 59]; // Sumi black ink mark
    return [244, 247, 250];
  }
  if (species === 'clownfish') {
    if (segIdx === 1) return [255, 255, 255]; // Front crisp white stripe
    if (segIdx === 3) return [255, 255, 255]; // Rear crisp white stripe
    return [249, 115, 22];
  }
  if (species === 'tetra') {
    if (isTop) return [203, 213, 225]; // Metallic silver back
    if (segIdx <= 2) return [34, 211, 238]; // Neon cyan glow flank
    return [244, 63, 94]; // Electric crimson rear belly
  }
  if (species === 'tang') {
    if (isTop && segIdx >= 1 && segIdx <= 2) return [15, 23, 42]; // Iconic black palette mark
    if (segIdx === 3) return [250, 204, 21]; // Yellow tail peduncle
    return isTop ? [3, 105, 161] : [14, 165, 233];
  }
  // Betta: iridescent sapphire & aqua
  if (segIdx === 0) return [56, 189, 248];
  return isTop ? [14, 165, 233] : [2, 132, 199];
}

function drawFish64(
  ctx: CanvasRenderingContext2D,
  spriteCanvas: HTMLCanvasElement,
  fish: Fish,
  isDay: boolean,
  time: number,
) {
  // Low-res N64 sprite buffer scaled cleanly with imageSmoothingEnabled = false
  const SPR_W = 54;
  const SPR_H = 42;
  if (spriteCanvas.width !== SPR_W || spriteCanvas.height !== SPR_H) {
    spriteCanvas.width = SPR_W;
    spriteCanvas.height = SPR_H;
  }
  const sctx = spriteCanvas.getContext('2d');
  if (!sctx) return;

  sctx.clearRect(0, 0, SPR_W, SPR_H);
  sctx.imageSmoothingEnabled = false;

  const speed = Math.hypot(fish.vx, fish.vy);
  const facingLeft = fish.vx < 0;
  const swimPitch = Math.max(
    -0.55,
    Math.min(0.55, Math.atan2(fish.vy, Math.max(0.35, Math.abs(fish.vx))) * 0.72),
  );
  // Subtle N64 3D camera yaw turn so you actually see the fish's 3D volume!
  const swimYaw =
    (facingLeft ? Math.PI : 0) +
    (facingLeft ? -1 : 1) * (0.28 + Math.sin(fish.phase * 0.24) * 0.16);
  const swimRoll = (facingLeft ? -1 : 1) * Math.sin(fish.phase * 0.45) * 0.14;

  // Base dimensions normalized in sprite-units (~ -13 to +13)
  const lenScale = fish.species === 'betta' ? 0.92 : fish.species === 'tang' ? 0.95 : 1.08;
  const bodyH = fish.species === 'tang' ? 6.2 : fish.species === 'clownfish' ? 5.6 : 4.6;
  const bodyD = fish.species === 'koi' ? 4.1 : 3.4;

  const wagAmp = 1.6 + Math.min(2.2, speed * 0.75);
  const wagAt = (tNorm: number) => Math.sin(fish.phase - tNorm * 2.4) * wagAmp * (tNorm * tNorm);

  // 5 cross-section stations from nose (+X) to tail base (-X)
  const stations = [
    {x: 11 * lenScale, hy: 0.45, hz: 0.45, zBend: 0},
    {x: 5.2 * lenScale, hy: bodyH * 0.84, hz: bodyD * 0.86, zBend: wagAt(0.15)},
    {x: 0, hy: bodyH, hz: bodyD, zBend: wagAt(0.35)},
    {x: -5.5 * lenScale, hy: bodyH * 0.66, hz: bodyD * 0.62, zBend: wagAt(0.65)},
    {x: -9.5 * lenScale, hy: bodyH * 0.22, hz: bodyD * 0.18, zBend: wagAt(0.95)},
  ];

  const rings = stations.map((st) => ({
    top: {x: st.x, y: -st.hy, z: st.zBend},
    right: {x: st.x, y: 0, z: st.zBend + st.hz},
    bottom: {x: st.x, y: st.hy, z: st.zBend},
    left: {x: st.x, y: 0, z: st.zBend - st.hz},
    center: {x: st.x, y: 0, z: st.zBend},
  }));

  const faces: PolyFace[] = [];

  // 1. 3D Faceted Body Hull (4 segments × 4 diamond flanks = 16 true 3D quads)
  for (let i = 0; i < rings.length - 1; i++) {
    const r0 = rings[i];
    const r1 = rings[i + 1];
    const segCenter: Vec3 = {
      x: (r0.center.x + r1.center.x) * 0.5,
      y: 0,
      z: (r0.center.z + r1.center.z) * 0.5,
    };

    const flankQuads: [Vec3, Vec3, Vec3, Vec3][] = [
      [r0.top, r1.top, r1.right, r0.right], // 0: Upper-Right
      [r0.right, r1.right, r1.bottom, r0.bottom], // 1: Lower-Right
      [r0.bottom, r1.bottom, r1.left, r0.left], // 2: Lower-Left
      [r0.left, r1.left, r1.top, r0.top], // 3: Upper-Left
    ];

    flankQuads.forEach((pts, fIdx) => {
      faces.push({
        pts,
        rgb: getFishBodyFacetRgb(fish.species, i, fIdx),
        centerHint: segCenter,
      });
    });
  }

  // 2. Flowing / Fan 3D Caudal Tail Fin
  const tailBase = rings[4];
  const tailZ = wagAt(1.38);
  const tailSpreadY = fish.species === 'betta' ? 8.2 : fish.species === 'koi' ? 6.4 : 4.8;
  const tailReachX = fish.species === 'betta' ? -19.5 : fish.species === 'koi' ? -16.8 : -15.2;
  const tailRgb: [number, number, number] =
    fish.species === 'betta'
      ? [56, 189, 248]
      : fish.species === 'koi'
        ? [226, 232, 240]
        : fish.species === 'tetra'
          ? [244, 63, 94]
          : fish.species === 'tang'
            ? [250, 204, 21]
            : [251, 146, 60];

  // Upper tail lobe & lower tail lobe
  faces.push({
    pts: [
      tailBase.top,
      {x: tailReachX, y: -tailSpreadY, z: tailZ},
      {x: tailReachX + 2.2, y: 0, z: tailZ * 0.9},
      tailBase.center,
    ],
    rgb: tailRgb,
    doubleSided: true,
  });
  faces.push({
    pts: [
      tailBase.center,
      {x: tailReachX + 2.2, y: 0, z: tailZ * 0.9},
      {x: tailReachX, y: tailSpreadY, z: tailZ},
      tailBase.bottom,
    ],
    rgb: tailRgb,
    doubleSided: true,
  });

  // 3. 3D Dorsal & (for Betta) Ventral Veil Fins
  const finRgb: [number, number, number] =
    fish.species === 'betta'
      ? [103, 232, 249]
      : fish.species === 'koi'
        ? [226, 232, 240]
        : fish.species === 'clownfish'
          ? [253, 186, 116]
          : [56, 189, 248];

  faces.push({
    pts: [
      rings[1].top,
      {x: rings[2].top.x - 1.2, y: -bodyH - (fish.species === 'betta' ? 4.8 : 3.2), z: wagAt(0.45)},
      {x: rings[3].top.x - 2.4, y: -bodyH - (fish.species === 'betta' ? 3.5 : 1.6), z: wagAt(0.75)},
      rings[3].top,
    ],
    rgb: finRgb,
    doubleSided: true,
  });

  if (fish.species === 'betta') {
    faces.push({
      pts: [
        rings[1].bottom,
        rings[3].bottom,
        {x: rings[3].bottom.x - 3.6, y: bodyH + 4.4, z: wagAt(0.8)},
        {x: rings[2].bottom.x - 1.2, y: bodyH + 4.8, z: wagAt(0.5)},
      ],
      rgb: [14, 165, 233],
      doubleSided: true,
    });
  }

  // 4. Fluttering Left & Right 3D Pectoral Fins
  const pecFlap = Math.sin(fish.phase * 1.4 + time * 2) * 1.8;
  faces.push({
    pts: [
      rings[1].right,
      {x: rings[2].right.x - 1.6, y: 2.2, z: rings[1].right.z + 3.4 + pecFlap},
      {x: rings[2].right.x - 0.4, y: 0.4, z: rings[1].right.z + 1.2},
    ],
    rgb: finRgb,
    doubleSided: true,
  });
  faces.push({
    pts: [
      rings[1].left,
      {x: rings[2].left.x - 1.6, y: 2.2, z: rings[1].left.z - 3.4 - pecFlap},
      {x: rings[2].left.x - 0.4, y: 0.4, z: rings[1].left.z - 1.2},
    ],
    rgb: finRgb,
    doubleSided: true,
  });

  // Rotate all mesh vertices in 3D space (using swimPitch around Z before flipping/yawing cleanly)
  const xform = (v: Vec3): Vec3 => {
    const pitched = rotateVec3(v, 0, 0, swimPitch);
    return rotateVec3(pitched, swimRoll, swimYaw, 0);
  };

  const camDist = 110;
  const cx = SPR_W * 0.54;
  const cy = SPR_H * 0.5;
  const projScale = 1.42;

  const projectPt = (v: Vec3): Vec3 => {
    const f = (camDist / Math.max(40, camDist - v.z)) * projScale;
    return {
      x: cx + v.x * f,
      y: cy + v.y * f,
      z: v.z,
    };
  };

  const projectedFaces = faces.map((face) => {
    const rotPts = face.pts.map(xform);
    const p2d = rotPts.map(projectPt);

    // Compute triangle/quad face normal
    const p0 = rotPts[0];
    const p1 = rotPts[1];
    const p2 = rotPts[2];
    const ux = p1.x - p0.x;
    const uy = p1.y - p0.y;
    const uz = p1.z - p0.z;
    const vx = p2.x - p0.x;
    const vy = p2.y - p0.y;
    const vz = p2.z - p0.z;
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;

    // Ensure solid hull normals always point away from segment center
    if (face.centerHint) {
      const rc = xform(face.centerHint);
      const fcX = rotPts.reduce((acc, p) => acc + p.x, 0) / rotPts.length - rc.x;
      const fcY = rotPts.reduce((acc, p) => acc + p.y, 0) / rotPts.length - rc.y;
      const fcZ = rotPts.reduce((acc, p) => acc + p.z, 0) / rotPts.length - rc.z;
      if (nx * fcX + ny * fcY + nz * fcZ < 0) {
        nx = -nx;
        ny = -ny;
        nz = -nz;
      }
    }

    const nLen = Math.max(0.0001, Math.hypot(nx, ny, nz));
    const normal = {x: nx / nLen, y: ny / nLen, z: nz / nLen};
    const avgZ = rotPts.reduce((acc, p) => acc + p.z, 0) / rotPts.length;

    return {
      p2d,
      rgb: face.rgb,
      doubleSided: Boolean(face.doubleSided),
      normal,
      avgZ,
    };
  });

  // Back-to-front painter's sort
  projectedFaces.sort((a, b) => a.avgZ - b.avgZ);

  const L = {x: 0.25, y: -0.7, z: 0.66};
  const nightBoost = !isDay && fish.species === 'tetra' ? 1.15 : 1;

  projectedFaces.forEach((f) => {
    if (!f.doubleSided && f.normal.z < -0.15) return;

    const nzUse = f.doubleSided ? Math.abs(f.normal.z) : f.normal.z;
    const dot = Math.max(-0.4, f.normal.x * L.x + f.normal.y * L.y + nzUse * L.z);
    const shade = Math.max(0.56, Math.min(1.16, (0.76 + dot * 0.36) * nightBoost));

    const r = Math.min(255, Math.round(f.rgb[0] * shade));
    const g = Math.min(255, Math.round(f.rgb[1] * shade));
    const b = Math.min(255, Math.round(f.rgb[2] * shade));

    sctx.fillStyle = `rgb(${r},${g},${b})`;
    sctx.strokeStyle = 'rgba(12, 28, 44, 0.55)';
    sctx.lineWidth = 0.75;
    sctx.beginPath();
    f.p2d.forEach((pt, idx) => {
      if (idx === 0) sctx.moveTo(pt.x, pt.y);
      else sctx.lineTo(pt.x, pt.y);
    });
    sctx.closePath();
    sctx.fill();
    sctx.stroke();
  });

  // Crisp 64-bit Square Pixel Eye projected on the camera-facing cheek
  const eyeZSide = facingLeft ? -bodyD * 0.54 : bodyD * 0.54;
  const eye3D = xform({x: 6.4 * lenScale, y: -1.1, z: eyeZSide});
  const eye2D = projectPt(eye3D);
  const ex = Math.round(eye2D.x);
  const ey = Math.round(eye2D.y);
  sctx.fillStyle = '#FFFFFF';
  sctx.fillRect(ex - 2, ey - 2, 4, 4);
  sctx.fillStyle = '#0F172A';
  sctx.fillRect(ex - 1, ey - 1, 2, 2);
  sctx.fillStyle = '#E0F2FE';
  sctx.fillRect(ex - 2, ey - 2, 1, 1);

  // Blit chunky 64-bit offscreen framebuffer sprite onto the main tank canvas
  const scaleFactor = fish.size / 14.2;
  const dstW = Math.round(SPR_W * scaleFactor);
  const dstH = Math.round(SPR_H * scaleFactor);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    spriteCanvas,
    Math.round(fish.x - dstW / 2),
    Math.round(fish.y - dstH / 2),
    dstW,
    dstH,
  );
  ctx.restore();
}

export function FishAquariumWidget() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fishesRef = useRef<Fish[]>([]);
  const starfishesRef = useRef<Starfish[]>([]);
  const pelletsRef = useRef<Pellet[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const bubblesRef = useRef<Bubble[]>([]);
  const wakeRef = useRef<SparkleWake[]>([]);
  const pointerRef = useRef<{x: number; y: number; active: boolean}>({
    x: 0,
    y: 0,
    active: false,
  });
  const nextIdRef = useRef(20);

  const [tankTheme, setTankTheme] = useState<TankTheme>('daylight');
  const [bubblesEnabled, setBubblesEnabled] = useState(true);
  const [fishCount, setFishCount] = useState(6);
  const [starfishCount, setStarfishCount] = useState(1);
  const [fedCount, setFedCount] = useState(0);

  const tankThemeRef = useRef<TankTheme>(tankTheme);
  const bubblesEnabledRef = useRef<boolean>(bubblesEnabled);

  useEffect(() => {
    tankThemeRef.current = tankTheme;
  }, [tankTheme]);

  useEffect(() => {
    bubblesEnabledRef.current = bubblesEnabled;
  }, [bubblesEnabled]);

  const initTank = (w: number, h: number) => {
    fishesRef.current = [
      createFish(1, 'betta', w, h),
      createFish(2, 'koi', w, h),
      createFish(3, 'tetra', w, h),
      createFish(4, 'tetra', w, h),
      createFish(5, 'clownfish', w, h),
      createFish(6, 'tang', w, h),
    ];
    starfishesRef.current = [createStarfish(101, w, 'coral', Math.max(120, w * 0.54))];
    pelletsRef.current = [];
    ripplesRef.current = [];
    wakeRef.current = [];
    bubblesRef.current = Array.from({length: 28}, (_, i) => {
      const fromVent = i % 3 === 0;
      return {
        x: fromVent ? 168 + (Math.random() - 0.5) * 18 : 40 + Math.random() * (w - 80),
        y: Math.random() * h,
        r: fromVent ? 2 + Math.random() * 3.8 : 1.8 + Math.random() * 4.2,
        speed: fromVent ? 0.85 + Math.random() * 0.75 : 0.42 + Math.random() * 0.65,
        wobble: Math.random() * Math.PI * 2,
        fromVent,
      };
    });
    setFishCount(6);
    setStarfishCount(1);
    setFedCount(0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const syncCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const targetW = Math.max(320, Math.round(rect.width || 1120));
      const targetH = Math.max(200, Math.round(rect.height || 370));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        // Keep existing fish and starfish cleanly inside bounds after viewport resize
        fishesRef.current.forEach((f) => {
          f.x = Math.min(Math.max(40, f.x), targetW - 40);
          f.y = Math.min(Math.max(36, f.y), targetH - 42);
          f.targetX = Math.min(Math.max(48, f.targetX), targetW - 48);
          f.targetY = Math.min(Math.max(40, f.targetY), targetH - 50);
        });
        starfishesRef.current.forEach((s) => {
          s.x = Math.min(Math.max(44, s.x), targetW - 44);
        });
      }
    };

    syncCanvasSize();
    initTank(canvas.width, canvas.height);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncCanvasSize) : null;
    resizeObserver?.observe(canvas);

    const spriteCanvas = document.createElement('canvas');

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animId = 0;
    let time = 0;

    const drawTank = () => {
      const w = canvas.width;
      const h = canvas.height;
      const isDay = tankThemeRef.current === 'daylight';
      time += prefersReduced ? 0.005 : 0.028;

      const stones = [
        {x: w * 0.09, y: h - 18, rx: 22, ry: 10, c: '#CBD5E1'},
        {x: w * 0.14, y: h - 15, rx: 15, ry: 8, c: '#94A3B8'},
        {x: w * 0.27, y: h - 16, rx: 20, ry: 9, c: '#E2E8F0'},
        {x: w * 0.72, y: h - 17, rx: 23, ry: 10, c: '#CBD5E1'},
        {x: w * 0.83, y: h - 14, rx: 17, ry: 8, c: '#94A3B8'},
        {x: w * 0.91, y: h - 18, rx: 22, ry: 10, c: '#E2E8F0'},
      ];

      const crystals = [
        {x: w * 0.31, y: h - 18, h: 30, w: 11, tilt: -0.18, c: 'rgba(56, 189, 248, 0.72)'},
        {x: w * 0.335, y: h - 17, h: 42, w: 13, tilt: 0.12, c: 'rgba(165, 243, 252, 0.78)'},
        {x: w * 0.77, y: h - 16, h: 34, w: 12, tilt: -0.14, c: 'rgba(52, 211, 153, 0.72)'},
      ];

      const ventX = Math.max(84, w * 0.17);

      // 1. Deep Luminous Frutiger Aero Water Backdrop
      const waterGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (isDay) {
        waterGrad.addColorStop(0, '#ECFBFF');
        waterGrad.addColorStop(0.2, '#7DD3FC');
        waterGrad.addColorStop(0.62, '#0284C7');
        waterGrad.addColorStop(1, '#075985');
      } else {
        waterGrad.addColorStop(0, '#0F2942');
        waterGrad.addColorStop(0.32, '#083344');
        waterGrad.addColorStop(0.75, '#07223B');
        waterGrad.addColorStop(1, '#041426');
      }
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Volumetric Sunbeams / Moonbeams
      ctx.save();
      for (let i = 0; i < 5; i++) {
        const beamX = w * (0.1 + i * 0.2) + Math.sin(time * 0.42 + i * 1.1) * 20;
        const beamGrad = ctx.createLinearGradient(beamX, 0, beamX + 80, h * 0.9);
        beamGrad.addColorStop(
          0,
          isDay ? 'rgba(255, 255, 255, 0.34)' : 'rgba(56, 189, 248, 0.14)',
        );
        beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(beamX - 24, 0);
        ctx.lineTo(beamX + 40, 0);
        ctx.lineTo(beamX + 145, h * 0.94);
        ctx.lineTo(beamX + 12, h * 0.94);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 3. Glossy Animated Surface Caustic Line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 22);
      for (let x = 0; x <= w; x += 14) {
        const waveY = 18 + Math.sin(x * 0.022 + time * 1.5) * 3.5 + Math.cos(x * 0.01 - time) * 1.5;
        ctx.lineTo(x, waveY);
      }
      ctx.lineTo(w, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fillStyle = isDay ? 'rgba(255, 255, 255, 0.5)' : 'rgba(125, 211, 252, 0.18)';
      ctx.fill();
      ctx.restore();

      // 4. Sandy Pebble Bed & Shimmering Floor Caustics
      const sandGrad = ctx.createLinearGradient(0, h - 42, 0, h);
      sandGrad.addColorStop(0, isDay ? '#BAE6FD' : '#1E3A5F');
      sandGrad.addColorStop(1, isDay ? '#F0F9FF' : '#0B1E33');
      ctx.fillStyle = sandGrad;
      ctx.beginPath();
      ctx.moveTo(0, h - 22);
      for (let x = 0; x <= w; x += 28) {
        ctx.lineTo(x, h - 22 + Math.sin(x * 0.016) * 5);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Shimmering caustic light loops dancing on the seabed
      ctx.save();
      ctx.strokeStyle = isDay ? 'rgba(255, 255, 255, 0.45)' : 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = 1.6;
      for (let c = 0; c < 6; c++) {
        const cx = ((c * 195 + time * 26) % (w + 120)) - 60;
        const cy = h - 14 + Math.sin(time + c) * 3;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 42 + Math.sin(time * 1.3 + c) * 8, 5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Smooth River Stones
      stones.forEach((st) => {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(st.x, st.y, st.rx, st.ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = isDay ? st.c : '#334155';
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(st.x - st.rx * 0.25, st.y - st.ry * 0.28, st.rx * 0.45, st.ry * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fill();
        ctx.restore();
      });

      // Translucent Aero Sea-Glass Crystals
      crystals.forEach((cr) => {
        ctx.save();
        ctx.translate(cr.x, cr.y);
        ctx.rotate(cr.tilt);
        ctx.beginPath();
        ctx.moveTo(-cr.w / 2, 0);
        ctx.lineTo(-cr.w / 3, -cr.h * 0.78);
        ctx.lineTo(0, -cr.h);
        ctx.lineTo(cr.w / 3, -cr.h * 0.78);
        ctx.lineTo(cr.w / 2, 0);
        ctx.closePath();
        ctx.fillStyle = cr.c;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      });

      // Chrome Aerator Dome Vent (left floor)
      ctx.save();
      const ventGrad = ctx.createLinearGradient(ventX - 18, h - 30, ventX + 18, h - 16);
      ventGrad.addColorStop(0, '#FFFFFF');
      ventGrad.addColorStop(0.5, '#CBD5E1');
      ventGrad.addColorStop(1, '#64748B');
      ctx.fillStyle = ventGrad;
      ctx.beginPath();
      ctx.ellipse(ventX, h - 18, 22, 9, 0, Math.PI, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Creeping Sea-Floor Starfishes
      starfishesRef.current.forEach((star) => {
        if (!prefersReduced) {
          star.x += star.dir * star.speed;
          star.phase += 0.032;
          if (star.x > w - 58) {
            star.x = w - 58;
            star.dir = -1;
          } else if (star.x < 58) {
            star.x = 58;
            star.dir = 1;
          }
        }
        star.wiggleBoost *= 0.94;
        drawStarfish64(ctx, spriteCanvas, star, h, isDay, time);
      });

      // Layered Swaying Aquatic Kelp Blades
      const plantClusters = [w * 0.06, w * 0.09, w * 0.12, w * 0.23, w * 0.75, w * 0.86, w * 0.9, w * 0.94];
      plantClusters.forEach((px, idx) => {
        const bladeH = Math.min(h * 0.34, 54 + (idx % 3) * 24);
        const sway = Math.sin(time * 1.15 + idx * 0.85) * 14;
        ctx.save();
        ctx.strokeStyle = isDay
          ? idx % 2 === 0
            ? 'rgba(16, 185, 129, 0.78)'
            : 'rgba(5, 150, 105, 0.68)'
          : 'rgba(52, 211, 153, 0.45)';
        ctx.lineWidth = idx % 2 === 0 ? 7 : 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px, h - 16);
        ctx.quadraticCurveTo(px + sway * 0.45, h - 16 - bladeH * 0.55, px + sway, h - 16 - bladeH);
        ctx.stroke();
        ctx.restore();
      });

      // 5. Rising Specular Glass Bubbles
      if (bubblesEnabledRef.current) {
        bubblesRef.current.forEach((b) => {
          b.y -= b.speed;
          b.wobble += 0.045;
          const bx = b.x + Math.sin(b.wobble) * (b.fromVent ? 4.2 : 2.6);
          if (b.y < 22) {
            b.y = b.fromVent ? h - 26 : h - 22;
            b.x = b.fromVent ? ventX + (Math.random() - 0.5) * 16 : 24 + Math.random() * Math.max(40, w - 48);
          }

          ctx.save();
          ctx.beginPath();
          ctx.arc(bx, b.y, b.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.76)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(bx - b.r * 0.3, b.y - b.r * 0.3, Math.max(0.8, b.r * 0.26), 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
          ctx.fill();
          ctx.restore();
        });
      }

      // 6. Pointer Hover Sparkle Wake
      for (let i = wakeRef.current.length - 1; i >= 0; i--) {
        const wk = wakeRef.current[i];
        wk.x += wk.vx;
        wk.y += wk.vy;
        wk.life += 1;
        const alpha = Math.max(0, 1 - wk.life / wk.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha * 0.85;
        ctx.beginPath();
        ctx.arc(wk.x, wk.y, wk.r, 0, Math.PI * 2);
        ctx.fillStyle = '#E0F2FE';
        ctx.fill();
        ctx.restore();
        if (wk.life >= wk.maxLife) wakeRef.current.splice(i, 1);
      }

      // 7. Water Surface Click & Nibble Ripples
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const rp = ripplesRef.current[i];
        rp.radius += 1.75;
        rp.alpha *= 0.94;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.radius, rp.radius * 0.45, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `${rp.color}${rp.alpha.toFixed(2)})`;
        ctx.lineWidth = 1.7;
        ctx.stroke();
        ctx.restore();
        if (rp.alpha < 0.04) ripplesRef.current.splice(i, 1);
      }

      // 8. Sinking Food Pellets
      for (let i = pelletsRef.current.length - 1; i >= 0; i--) {
        const p = pelletsRef.current[i];
        p.y += p.vy;
        p.x += p.vx;
        p.vx *= 0.97;
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FDE047';
        ctx.fill();
        ctx.strokeStyle = '#CA8A04';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        if (p.y > h - 20) pelletsRef.current.splice(i, 1);
      }

      // 9. Articulated Steering & Undulating Swimming Fish
      fishesRef.current.forEach((fish) => {
        const speedMag = Math.hypot(fish.vx, fish.vy);
        fish.phase += 0.11 + speedMag * 0.055;

        let goalX = fish.targetX;
        let goalY = fish.targetY;
        let seekingFood = false;

        if (pelletsRef.current.length > 0) {
          let closestDist = Infinity;
          let closestIdx = -1;
          pelletsRef.current.forEach((p, pIdx) => {
            const d = Math.hypot(p.x - fish.x, p.y - fish.y);
            if (d < closestDist) {
              closestDist = d;
              closestIdx = pIdx;
            }
          });
          if (closestIdx !== -1) {
            const food = pelletsRef.current[closestIdx];
            goalX = food.x;
            goalY = food.y;
            seekingFood = true;
            if (closestDist < fish.size * 0.95) {
              ripplesRef.current.push({
                x: food.x,
                y: food.y,
                radius: 5,
                alpha: 0.78,
                color: 'rgba(253, 224, 71, ',
              });
              pelletsRef.current.splice(closestIdx, 1);
              setFedCount((c) => c + 1);
            }
          }
        } else if (pointerRef.current.active) {
          // Curious fish gently drift toward cursor when nearby
          const pd = Math.hypot(pointerRef.current.x - fish.x, pointerRef.current.y - fish.y);
          if (pd < 240 && pd > 45) {
            goalX = pointerRef.current.x;
            goalY = pointerRef.current.y;
          }
        }

        if (!seekingFood && Math.hypot(goalX - fish.x, goalY - fish.y) < 42) {
          fish.targetX = 80 + Math.random() * (w - 160);
          fish.targetY = 54 + Math.random() * (h - 115);
        }

        const dx = goalX - fish.x;
        const dy = goalY - fish.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const maxSpeed = (seekingFood ? 2.75 : 1.38) * fish.speedMult;

        const desiredVx = (dx / dist) * maxSpeed;
        const desiredVy = (dy / dist) * maxSpeed;

        fish.vx += (desiredVx - fish.vx) * 0.042;
        fish.vy += (desiredVy - fish.vy) * 0.042;

        if (!prefersReduced) {
          fish.x += fish.vx;
          fish.y += fish.vy + Math.sin(fish.phase * 0.45) * 0.1;
        }

        // Smooth boundary turn-back
        if (fish.x < 52) fish.vx += 0.16;
        if (fish.x > w - 52) fish.vx -= 0.16;
        if (fish.y < 42) fish.vy += 0.14;
        if (fish.y > h - 48) fish.vy -= 0.14;

        drawFish64(ctx, spriteCanvas, fish, isDay, time);
      });

      animId = requestAnimationFrame(drawTank);
    };

    const onAquariumSplash = (ev: Event) => {
      const detail = (ev as CustomEvent<{clientX: number; clientY: number}>).detail;
      if (!detail) return;
      const rect = canvas.getBoundingClientRect();
      if (
        detail.clientX < rect.left ||
        detail.clientX > rect.right ||
        detail.clientY < rect.top ||
        detail.clientY > rect.bottom
      ) {
        return;
      }
      const sx = ((detail.clientX - rect.left) / rect.width) * canvas.width;
      const sy = ((detail.clientY - rect.top) / rect.height) * canvas.height;
      ripplesRef.current.push({
        x: sx,
        y: sy,
        radius: 12,
        alpha: 0.95,
        color: 'rgba(103, 232, 249, ',
      });
      for (let i = 0; i < 6; i++) {
        pelletsRef.current.push({
          x: sx + (Math.random() - 0.5) * 32,
          y: sy + (Math.random() - 0.5) * 14,
          vx: (Math.random() - 0.5) * 1.4,
          vy: 0.55 + Math.random() * 0.45,
          radius: 3.2,
        });
      }
      starfishesRef.current.forEach((star) => {
        star.wiggleBoost = 1;
      });
    };

    window.addEventListener('amka:aquarium-splash', onAquariumSplash);
    animId = requestAnimationFrame(drawTank);
    return () => {
      window.removeEventListener('amka:aquarium-splash', onAquariumSplash);
      cancelAnimationFrame(animId);
      resizeObserver?.disconnect();
    };
  }, []);

  const handleTankClick = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    ripplesRef.current.push({
      x,
      y,
      radius: 8,
      alpha: 0.88,
      color: 'rgba(255, 255, 255, ',
    });
    for (let i = 0; i < 4; i++) {
      pelletsRef.current.push({
        x: x + (Math.random() - 0.5) * 22,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 0.9,
        vy: 0.65 + Math.random() * 0.4,
        radius: 3.1,
      });
    }
    // Wiggle starfish when tapped near the seabed
    starfishesRef.current.forEach((star) => {
      const floorY = canvas.height - 18 + Math.sin(star.x * 0.016) * 5;
      if (Math.hypot(x - star.x, y - floorY) < 60) {
        star.wiggleBoost = 1;
      }
    });
  };

  const handleTankMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    pointerRef.current = {x, y, active: true};
    if (wakeRef.current.length < 36 && Math.random() > 0.45) {
      wakeRef.current.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.4 - Math.random() * 0.4,
        life: 0,
        maxLife: 24,
        r: 1.4 + Math.random() * 1.6,
      });
    }
  };

  const handleTankLeave = () => {
    pointerRef.current.active = false;
  };

  const handleAddFish = (species: Species) => {
    const canvas = canvasRef.current;
    if (!canvas || fishesRef.current.length >= 18) return;
    const id = nextIdRef.current++;
    fishesRef.current.push(createFish(id, species, canvas.width, canvas.height));
    setFishCount(fishesRef.current.length);
  };

  const handleAddStarfish = () => {
    const canvas = canvasRef.current;
    if (!canvas || starfishesRef.current.length >= 5) return;
    const colors: StarfishColor[] = ['coral', 'peach', 'aqua'];
    const nextColor = colors[starfishesRef.current.length % colors.length];
    const id = nextIdRef.current++;
    starfishesRef.current.push(createStarfish(id, canvas.width, nextColor));
    setStarfishCount(starfishesRef.current.length);
  };

  const handleReset = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    initTank(canvas.width, canvas.height);
  };

  return (
    <section id="aquarium" className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#40566E] dark:text-[#9EB6CF]">
            Interactive 64-Bit Aquarium · Move Cursor or Tap Water to Drop Pellets
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#0C1C2C] dark:text-[#ECF4FD] sm:text-3xl">
            Frutiger Aero 64-Bit Aquarium
          </h2>
        </div>

        <p className="text-xs font-code text-[#40566E] dark:text-[#9EB6CF] tabular-nums">
          {fishCount} Swimming · {starfishCount} Starfish · {fedCount} Pellets Nibbled
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl aero-chrome-panel">
        {/* Brushed Y2K Silver Widget Chrome Bar */}
        <div className="aero-silver-header flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddFish('betta')}
              disabled={fishCount >= 18}
              className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold aero-btn-silver disabled:opacity-45 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5 text-[#0284C7] dark:text-[#38BDF8]" />
              <span>Veiltail Betta</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddFish('koi')}
              disabled={fishCount >= 18}
              className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold aero-btn-silver disabled:opacity-45 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5 text-[#EF4444]" />
              <span>Chrome Koi</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddFish('tetra')}
              disabled={fishCount >= 18}
              className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold aero-btn-silver disabled:opacity-45 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5 text-[#06B6D4]" />
              <span>Neon Tetra</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddFish('clownfish')}
              disabled={fishCount >= 18}
              className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold aero-btn-silver disabled:opacity-45 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5 text-[#F97316]" />
              <span>Clownfish</span>
            </button>
            <button
              type="button"
              onClick={handleAddStarfish}
              disabled={starfishCount >= 5}
              className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold aero-btn-silver disabled:opacity-45 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5 text-[#EA580C]" />
              <span>Starfish</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setBubblesEnabled((b) => !b)}
              className={`inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                bubblesEnabled ? 'aero-btn-aqua' : 'aero-btn-silver'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{bubblesEnabled ? 'Bubbles On' : 'Bubbles Off'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setTankTheme((t) => (t === 'daylight' ? 'twilight' : 'daylight'))
              }
              className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold aero-btn-silver whitespace-nowrap shrink-0"
            >
              {tankTheme === 'daylight' ? (
                <>
                  <Moon className="h-3.5 w-3.5 text-[#0369A1] dark:text-[#38BDF8]" />
                  <span>Twilight Tank</span>
                </>
              ) : (
                <>
                  <Sun className="h-3.5 w-3.5 text-[#D97706]" />
                  <span>Daylight Tank</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset aquarium"
              className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold aero-btn-silver whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Glass Tank Viewport */}
        <div className="relative aero-well p-2.5 sm:p-3.5">
          <div className="relative overflow-hidden rounded-xl border border-[#89A5C2] dark:border-[#2C4766] shadow-[inset_0_2px_10px_rgba(7,89,133,0.28)]">
            <canvas
              ref={canvasRef}
              width={1120}
              height={390}
              onPointerDown={handleTankClick}
              onPointerMove={handleTankMove}
              onPointerLeave={handleTankLeave}
              aria-label="Interactive Frutiger Aero fish aquarium. Move your cursor or tap anywhere in the water to drop food pellets."
              className="block h-[230px] w-full cursor-pointer touch-manipulation sm:h-[370px]"
            />
            <div className="pointer-events-none absolute inset-0 aero-specular-sheen" />
          </div>
        </div>
      </div>
    </section>
  );
}
