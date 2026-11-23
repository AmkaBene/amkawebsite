import {useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent} from 'react';
import {Brush, Music, Pause, SkipForward, X} from 'lucide-react';

type BuddyMode = 'walking' | 'idle' | 'grabbed' | 'airborne' | 'dancing' | 'drawing';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Face3D {
  pts: [Vec3, Vec3, Vec3, Vec3];
  rgb: [number, number, number];
  kind?: 'head-front';
}

interface DoodleStroke {
  color: string;
  size: number;
  points: {nx: number; ny: number}[];
}

const BUDDY_SIZE = 88;
const CANVAS_RES = 96;

const MIKU_QUOTES = [
  'World is mine ♪',
  'Toss me! ( > ᗜ < )',
  'Let’s play a track ♪',
  '64-bit SKKU energy!',
  'Catch me!!',
  'Art time on Paint Pad ★',
];

const SINGING_LYRICS = [
  '♪ Sekai de ichiban~ ♪',
  '♪ Mi-mi-ku! La la~ ♪',
  '♪ Tell your world ♪',
  '♪ Leek spin dance~ ♫',
  '♪ Melt into the sky ♪',
];

const SINGING_MELODIES: number[][] = [
  [554.37, 622.25, 739.99, 622.25], // World Is Mine motif
  [523.25, 587.33, 659.25, 783.99], // Tell Your World motif
  [440.0, 523.25, 659.25, 587.33],  // Cheerful pop motif
  [587.33, 659.25, 783.99, 880.0],  // High sparkle motif
];

const DOODLE_LIBRARY: {name: string; strokes: DoodleStroke[]}[] = [
  {
    name: '5-Pointed Aero Star',
    strokes: [
      {
        color: '#0284C7',
        size: 6,
        points: [
          {nx: 0.72, ny: 0.16},
          {nx: 0.76, ny: 0.28},
          {nx: 0.88, ny: 0.28},
          {nx: 0.78, ny: 0.36},
          {nx: 0.82, ny: 0.49},
          {nx: 0.72, ny: 0.41},
          {nx: 0.62, ny: 0.49},
          {nx: 0.66, ny: 0.36},
          {nx: 0.56, ny: 0.28},
          {nx: 0.68, ny: 0.28},
          {nx: 0.72, ny: 0.16},
        ],
      },
      {
        color: '#38BDF8',
        size: 4,
        points: [
          {nx: 0.54, ny: 0.22},
          {nx: 0.5, ny: 0.18},
        ],
      },
      {
        color: '#38BDF8',
        size: 4,
        points: [
          {nx: 0.9, ny: 0.22},
          {nx: 0.93, ny: 0.17},
        ],
      },
    ],
  },
  {
    name: 'Cyan Eighth Note',
    strokes: [
      {
        color: '#0284C7',
        size: 7,
        points: [
          {nx: 0.24, ny: 0.56},
          {nx: 0.2, ny: 0.59},
          {nx: 0.19, ny: 0.64},
          {nx: 0.23, ny: 0.66},
          {nx: 0.28, ny: 0.63},
          {nx: 0.28, ny: 0.34},
          {nx: 0.37, ny: 0.39},
          {nx: 0.39, ny: 0.46},
        ],
      },
      {
        color: '#059669',
        size: 5,
        points: [
          {nx: 0.35, ny: 0.68},
          {nx: 0.4, ny: 0.63},
          {nx: 0.45, ny: 0.68},
        ],
      },
    ],
  },
  {
    name: 'Aqua Heart',
    strokes: [
      {
        color: '#BE185D',
        size: 6,
        points: [
          {nx: 0.5, ny: 0.36},
          {nx: 0.45, ny: 0.27},
          {nx: 0.38, ny: 0.27},
          {nx: 0.35, ny: 0.34},
          {nx: 0.39, ny: 0.44},
          {nx: 0.5, ny: 0.55},
          {nx: 0.61, ny: 0.44},
          {nx: 0.65, ny: 0.34},
          {nx: 0.62, ny: 0.27},
          {nx: 0.55, ny: 0.27},
          {nx: 0.5, ny: 0.36},
        ],
      },
      {
        color: '#38BDF8',
        size: 4,
        points: [
          {nx: 0.44, ny: 0.2},
          {nx: 0.46, ny: 0.15},
        ],
      },
    ],
  },
];

function rotatePoint(p: Vec3, rx: number, ry: number, rz: number): Vec3 {
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

function addLocalPartBox(
  faces: Face3D[],
  partCenter: Vec3,
  partRot: Vec3,
  bodyRot: Vec3,
  w: number,
  h: number,
  d: number,
  rgb: [number, number, number],
  localOffset: Vec3 = {x: 0, y: 0, z: 0},
  frontKind?: 'head-front',
) {
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;
  const ox = localOffset.x;
  const oy = localOffset.y;
  const oz = localOffset.z;

  const corners: Vec3[] = [
    {x: ox - hw, y: oy - hh, z: oz + hd}, // 0 Front TL
    {x: ox + hw, y: oy - hh, z: oz + hd}, // 1 Front TR
    {x: ox + hw, y: oy + hh, z: oz + hd}, // 2 Front BR
    {x: ox - hw, y: oy + hh, z: oz + hd}, // 3 Front BL
    {x: ox - hw, y: oy - hh, z: oz - hd}, // 4 Back TL
    {x: ox + hw, y: oy - hh, z: oz - hd}, // 5 Back TR
    {x: ox + hw, y: oy + hh, z: oz - hd}, // 6 Back BR
    {x: ox - hw, y: oy + hh, z: oz - hd}, // 7 Back BL
  ].map((v) => {
    const pr = rotatePoint(v, partRot.x, partRot.y, partRot.z);
    const worldLocal = {x: pr.x + partCenter.x, y: pr.y + partCenter.y, z: pr.z + partCenter.z};
    return rotatePoint(worldLocal, bodyRot.x, bodyRot.y, bodyRot.z);
  });

  const quads: {idx: [number, number, number, number]; kind?: 'head-front'}[] = [
    {idx: [0, 1, 2, 3], kind: frontKind}, // Front (+Z)
    {idx: [5, 4, 7, 6]}, // Back (-Z)
    {idx: [1, 5, 6, 2]}, // Right (+X)
    {idx: [4, 0, 3, 7]}, // Left (-X)
    {idx: [4, 5, 1, 0]}, // Top (-Y)
    {idx: [3, 2, 6, 7]}, // Bottom (+Y)
  ];

  quads.forEach(({idx, kind}) => {
    faces.push({
      pts: [corners[idx[0]], corners[idx[1]], corners[idx[2]], corners[idx[3]]],
      rgb,
      kind,
    });
  });
}

function bilerpQuad(pts: [Vec3, Vec3, Vec3, Vec3], u: number, v: number): {x: number; y: number} {
  const [tl, tr, br, bl] = pts;
  const topX = tl.x + (tr.x - tl.x) * u;
  const topY = tl.y + (tr.y - tl.y) * u;
  const botX = bl.x + (br.x - bl.x) * u;
  const botY = bl.y + (br.y - bl.y) * u;
  return {
    x: topX + (botX - topX) * v,
    y: topY + (botY - topY) * v,
  };
}

function drawQuadPixelRect(
  ctx: CanvasRenderingContext2D,
  quad: [Vec3, Vec3, Vec3, Vec3],
  u0: number,
  v0: number,
  u1: number,
  v1: number,
  fill: string,
) {
  const a = bilerpQuad(quad, u0, v0);
  const b = bilerpQuad(quad, u1, v0);
  const c = bilerpQuad(quad, u1, v1);
  const d = bilerpQuad(quad, u0, v1);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.fill();
}

function renderMiku64(
  ctx: CanvasRenderingContext2D,
  opts: {
    time: number;
    mode: BuddyMode;
    facing: 1 | -1;
    pitch: number;
    yawOffset: number;
    roll: number;
    vx: number;
    vy: number;
  },
) {
  const {time, mode, facing, pitch, yawOffset, roll, vx, vy} = opts;
  ctx.clearRect(0, 0, CANVAS_RES, CANVAS_RES);

  // Subtle 64-bit ground shadow disc when walking/dancing/drawing/idle
  if (mode !== 'grabbed' && mode !== 'airborne') {
    ctx.save();
    ctx.fillStyle = 'rgba(12, 28, 44, 0.25)';
    ctx.beginPath();
    ctx.ellipse(CANVAS_RES / 2, 87, 17, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Compute limb & hair kinematics based on state
  const walkSpeed = mode === 'walking' ? Math.min(1.5, Math.abs(vx) / 48 + 0.8) : 0;
  const walkSwing = mode === 'walking' ? Math.sin(time * 9 * walkSpeed) * 0.65 : 0;
  const danceBounce = mode === 'dancing' ? Math.sin(time * 10) : 0;
  const drawWave = mode === 'drawing' ? Math.sin(time * 11) * 0.5 : 0;

  const legLRotX =
    mode === 'grabbed'
      ? Math.sin(time * 16) * 0.55
      : mode === 'dancing'
        ? danceBounce * 0.38
        : walkSwing;
  const legRRotX =
    mode === 'grabbed'
      ? -Math.sin(time * 16) * 0.55
      : mode === 'dancing'
        ? -danceBounce * 0.38
        : -walkSwing;

  const armLRotX =
    mode === 'grabbed'
      ? -1.8 + Math.sin(time * 18) * 0.4
      : mode === 'dancing'
        ? -1.2 + Math.sin(time * 10) * 0.65
        : -walkSwing * 0.8;
  const armRRotX =
    mode === 'grabbed'
      ? -1.8 - Math.sin(time * 18) * 0.4
      : mode === 'drawing'
        ? -1.25 + drawWave
        : mode === 'dancing'
          ? -1.2 - Math.sin(time * 10) * 0.65
          : walkSwing * 0.8;

  const tailSwingZ =
    mode === 'grabbed' || mode === 'airborne'
      ? Math.max(-0.6, Math.min(0.6, -vy * 0.0008))
      : Math.sin(time * 4.5) * 0.14;
  const tailLagX =
    mode === 'grabbed' || mode === 'airborne'
      ? Math.max(-0.55, Math.min(0.55, vy * 0.0009))
      : mode === 'walking'
        ? -0.25
        : 0;

  // Base 3D orientation (yaw turns her slightly toward direction of travel, plus 3D toss spin)
  const baseYaw = facing === 1 ? 0.38 : -0.38;
  const bodyRot: Vec3 = {
    x: pitch,
    y: baseYaw + yawOffset + (mode === 'dancing' ? Math.sin(time * 5) * 0.45 : 0),
    z: roll,
  };

  const faces: Face3D[] = [];
  const ZERO: Vec3 = {x: 0, y: 0, z: 0};

  // Palette (N64 Saturated Cyan / Silver / Charcoal / Skin)
  const SKIN: [number, number, number] = [252, 231, 214];
  const CYAN: [number, number, number] = [34, 211, 238];
  const CYAN_DEEP: [number, number, number] = [6, 182, 212];
  const SILVER: [number, number, number] = [203, 213, 225];
  const DARK: [number, number, number] = [30, 41, 59];
  const MAGENTA: [number, number, number] = [236, 72, 153];
  const LEEK_GREEN: [number, number, number] = [74, 222, 128];
  const LEEK_WHITE: [number, number, number] = [248, 250, 252];
  const BRUSH_BLUE: [number, number, number] = [2, 132, 199];

  // 1. Torso (Grey sleeveless top + Aqua tie + Collar)
  addLocalPartBox(faces, {x: 0, y: -4, z: 0}, ZERO, bodyRot, 11, 12, 7.5, SILVER);
  addLocalPartBox(faces, {x: 0, y: -3.5, z: 3.9}, ZERO, bodyRot, 2.6, 10, 1.4, CYAN_DEEP);

  // 2. Skirt (Dark pleated block + Cyan trim band)
  addLocalPartBox(faces, {x: 0, y: 4.5, z: 0}, ZERO, bodyRot, 14, 6, 9.5, DARK);
  addLocalPartBox(faces, {x: 0, y: 7, z: 0}, ZERO, bodyRot, 14.4, 1.5, 9.8, CYAN);

  // 3. Legs & Boots
  // Left Leg
  addLocalPartBox(
    faces,
    {x: -3.4, y: 7.5, z: 0},
    {x: legLRotX, y: 0, z: 0},
    bodyRot,
    4.2,
    4.5,
    4.2,
    SKIN,
    {x: 0, y: 2.2, z: 0},
  );
  addLocalPartBox(
    faces,
    {x: -3.4, y: 7.5, z: 0},
    {x: legLRotX, y: 0, z: 0},
    bodyRot,
    4.8,
    10,
    5.4,
    DARK,
    {x: 0, y: 9.2, z: 0.4},
  );
  addLocalPartBox(
    faces,
    {x: -3.4, y: 7.5, z: 0},
    {x: legLRotX, y: 0, z: 0},
    bodyRot,
    5,
    1.8,
    5.6,
    CYAN,
    {x: 0, y: 5.5, z: 0.4},
  );

  // Right Leg
  addLocalPartBox(
    faces,
    {x: 3.4, y: 7.5, z: 0},
    {x: legRRotX, y: 0, z: 0},
    bodyRot,
    4.2,
    4.5,
    4.2,
    SKIN,
    {x: 0, y: 2.2, z: 0},
  );
  addLocalPartBox(
    faces,
    {x: 3.4, y: 7.5, z: 0},
    {x: legRRotX, y: 0, z: 0},
    bodyRot,
    4.8,
    10,
    5.4,
    DARK,
    {x: 0, y: 9.2, z: 0.4},
  );
  addLocalPartBox(
    faces,
    {x: 3.4, y: 7.5, z: 0},
    {x: legRRotX, y: 0, z: 0},
    bodyRot,
    5,
    1.8,
    5.6,
    CYAN,
    {x: 0, y: 5.5, z: 0.4},
  );

  // 4. Arms & Held Prop (3D Leek or Paintbrush!)
  addLocalPartBox(
    faces,
    {x: -7.5, y: -8.5, z: 0},
    {x: armLRotX, y: 0, z: 0.18},
    bodyRot,
    3.6,
    4.5,
    3.6,
    SKIN,
    {x: 0, y: 2, z: 0},
  );
  addLocalPartBox(
    faces,
    {x: -7.5, y: -8.5, z: 0},
    {x: armLRotX, y: 0, z: 0.18},
    bodyRot,
    4.2,
    6,
    4.2,
    DARK,
    {x: 0, y: 7, z: 0},
  );

  // Right arm holding Leek / Paintbrush
  addLocalPartBox(
    faces,
    {x: 7.5, y: -8.5, z: 0},
    {x: armRRotX, y: 0, z: -0.18},
    bodyRot,
    3.6,
    4.5,
    3.6,
    SKIN,
    {x: 0, y: 2, z: 0},
  );
  addLocalPartBox(
    faces,
    {x: 7.5, y: -8.5, z: 0},
    {x: armRRotX, y: 0, z: -0.18},
    bodyRot,
    4.2,
    6,
    4.2,
    DARK,
    {x: 0, y: 7, z: 0},
  );
  if (mode === 'drawing') {
    // 64-bit Silver/Blue Paintbrush
    addLocalPartBox(
      faces,
      {x: 7.5, y: -8.5, z: 0},
      {x: armRRotX - 0.85, y: 0, z: -0.18},
      bodyRot,
      2,
      11,
      2,
      SILVER,
      {x: 0, y: 11, z: 4},
    );
    addLocalPartBox(
      faces,
      {x: 7.5, y: -8.5, z: 0},
      {x: armRRotX - 0.85, y: 0, z: -0.18},
      bodyRot,
      2.6,
      3.5,
      2.6,
      BRUSH_BLUE,
      {x: 0, y: 17.5, z: 4},
    );
  } else {
    // 64-bit Green Onion / Leek
    addLocalPartBox(
      faces,
      {x: 7.5, y: -8.5, z: 0},
      {x: armRRotX - 0.8, y: 0, z: -0.18},
      bodyRot,
      2.2,
      4.5,
      2.2,
      LEEK_WHITE,
      {x: 0, y: 10.5, z: 3.5},
    );
    addLocalPartBox(
      faces,
      {x: 7.5, y: -8.5, z: 0},
      {x: armRRotX - 0.8, y: 0, z: -0.18},
      bodyRot,
      2.5,
      8.5,
      2.5,
      LEEK_GREEN,
      {x: 0, y: 16.5, z: 3.5},
    );
  }

  // 5. Chibi 64-Bit Head + Hair Cap + Bangs
  addLocalPartBox(
    faces,
    {x: 0, y: -17.5, z: 0},
    ZERO,
    bodyRot,
    14.5,
    14.5,
    13,
    SKIN,
    ZERO,
    'head-front',
  );
  // Top hair crown & back hair
  addLocalPartBox(faces, {x: 0, y: -26, z: 0}, ZERO, bodyRot, 16, 4.2, 14.5, CYAN);
  addLocalPartBox(faces, {x: 0, y: -17.5, z: -5.8}, ZERO, bodyRot, 16, 15, 3.6, CYAN_DEEP);
  // Side locks & jagged N64 front bangs
  addLocalPartBox(faces, {x: -6.8, y: -18, z: 3.5}, ZERO, bodyRot, 3, 13, 6.2, CYAN);
  addLocalPartBox(faces, {x: 6.8, y: -18, z: 3.5}, ZERO, bodyRot, 3, 13, 6.2, CYAN);
  addLocalPartBox(faces, {x: -3.2, y: -22.5, z: 6.8}, ZERO, bodyRot, 5.4, 4.8, 1.8, CYAN);
  addLocalPartBox(faces, {x: 3.2, y: -22.5, z: 6.8}, ZERO, bodyRot, 5.4, 4.8, 1.8, CYAN);
  addLocalPartBox(faces, {x: 0, y: -21.5, z: 7}, ZERO, bodyRot, 3.2, 5.5, 1.8, CYAN);

  // Headset & Square Hair Ties
  addLocalPartBox(faces, {x: -8.8, y: -23.5, z: 0}, ZERO, bodyRot, 3, 4.6, 4.6, DARK);
  addLocalPartBox(faces, {x: -8.9, y: -23.5, z: 0}, ZERO, bodyRot, 3.2, 2.2, 4.8, MAGENTA);
  addLocalPartBox(faces, {x: 8.8, y: -23.5, z: 0}, ZERO, bodyRot, 3, 4.6, 4.6, DARK);
  addLocalPartBox(faces, {x: 8.9, y: -23.5, z: 0}, ZERO, bodyRot, 3.2, 2.2, 4.8, MAGENTA);

  // 6. Articulated Dual Twin-Tails (Upper + Lower trailing segments)
  // Left Twin-tail
  addLocalPartBox(
    faces,
    {x: -10.2, y: -22, z: -1},
    {x: tailLagX, y: 0, z: 0.25 + tailSwingZ},
    bodyRot,
    4.6,
    13,
    4.6,
    CYAN,
    {x: -1.5, y: 6.5, z: 0},
  );
  addLocalPartBox(
    faces,
    {x: -10.2, y: -22, z: -1},
    {x: tailLagX * 1.25, y: 0, z: 0.34 + tailSwingZ * 1.4},
    bodyRot,
    3.6,
    12,
    3.6,
    CYAN_DEEP,
    {x: -2.2, y: 18, z: -0.6},
  );

  // Right Twin-tail
  addLocalPartBox(
    faces,
    {x: 10.2, y: -22, z: -1},
    {x: tailLagX, y: 0, z: -0.25 - tailSwingZ},
    bodyRot,
    4.6,
    13,
    4.6,
    CYAN,
    {x: 1.5, y: 6.5, z: 0},
  );
  addLocalPartBox(
    faces,
    {x: 10.2, y: -22, z: -1},
    {x: tailLagX * 1.25, y: 0, z: -0.34 - tailSwingZ * 1.4},
    bodyRot,
    3.6,
    12,
    3.6,
    CYAN_DEEP,
    {x: 2.2, y: 18, z: -0.6},
  );

  // Project vertices to 2D canvas coords with mild perspective
  const camDist = 185;
  const centerX = CANVAS_RES / 2;
  const centerY = 53 + (mode === 'dancing' ? Math.abs(danceBounce) * -4 : 0);
  const scale = 1.38;

  const projectedFaces = faces.map((face) => {
    const p2d: Vec3[] = face.pts.map((pt) => {
      const zCam = camDist - pt.z;
      const factor = (camDist / Math.max(60, zCam)) * scale;
      return {
        x: centerX + pt.x * factor,
        y: centerY + pt.y * factor,
        z: pt.z,
      };
    });

    // Compute camera-space normal using cross product
    const u = {
      x: face.pts[1].x - face.pts[0].x,
      y: face.pts[1].y - face.pts[0].y,
      z: face.pts[1].z - face.pts[0].z,
    };
    const v = {
      x: face.pts[3].x - face.pts[0].x,
      y: face.pts[3].y - face.pts[0].y,
      z: face.pts[3].z - face.pts[0].z,
    };
    // Cross u x v points toward -Z in Y-down right-handed system; flip to outward (+Z on front face)
    const nx = -(u.y * v.z - u.z * v.y);
    const ny = -(u.z * v.x - u.x * v.z);
    const nz = -(u.x * v.y - u.y * v.x);
    const nLen = Math.max(0.0001, Math.hypot(nx, ny, nz));
    const n = {x: nx / nLen, y: ny / nLen, z: nz / nLen};

    const avgZ = (face.pts[0].z + face.pts[1].z + face.pts[2].z + face.pts[3].z) * 0.25;
    return {
      pts: p2d as [Vec3, Vec3, Vec3, Vec3],
      rgb: face.rgb,
      kind: face.kind,
      normal: n,
      avgZ,
    };
  });

  // Back-to-front painter's sort
  projectedFaces.sort((a, b) => a.avgZ - b.avgZ);

  // Light vector from top-front-right
  const L = {x: 0.34, y: -0.62, z: 0.7};

  projectedFaces.forEach((f) => {
    // Cull faces pointing sharply away from camera
    if (f.normal.z < -0.18) return;

    const dot = Math.max(-0.4, f.normal.x * L.x + f.normal.y * L.y + f.normal.z * L.z);
    const shade = Math.max(0.58, Math.min(1.12, 0.76 + dot * 0.36));
    const r = Math.min(255, Math.round(f.rgb[0] * shade));
    const g = Math.min(255, Math.round(f.rgb[1] * shade));
    const b = Math.min(255, Math.round(f.rgb[2] * shade));

    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(f.pts[0].x, f.pts[0].y);
    ctx.lineTo(f.pts[1].x, f.pts[1].y);
    ctx.lineTo(f.pts[2].x, f.pts[2].y);
    ctx.lineTo(f.pts[3].x, f.pts[3].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crisp 64-bit pixel face projected cleanly onto front of head box
    if (f.kind === 'head-front' && f.normal.z > 0.12) {
      const q = f.pts;
      // Rosy pixel cheeks
      drawQuadPixelRect(ctx, q, 0.12, 0.68, 0.28, 0.78, 'rgba(251, 113, 133, 0.68)');
      drawQuadPixelRect(ctx, q, 0.72, 0.68, 0.88, 0.78, 'rgba(251, 113, 133, 0.68)');

      if (mode === 'grabbed' || mode === 'airborne') {
        // Dizzy > < pixel eyes + open mouth
        drawQuadPixelRect(ctx, q, 0.17, 0.44, 0.34, 0.52, '#0F172A');
        drawQuadPixelRect(ctx, q, 0.22, 0.52, 0.36, 0.6, '#0F172A');
        drawQuadPixelRect(ctx, q, 0.66, 0.44, 0.83, 0.52, '#0F172A');
        drawQuadPixelRect(ctx, q, 0.64, 0.52, 0.78, 0.6, '#0F172A');
        drawQuadPixelRect(ctx, q, 0.43, 0.75, 0.57, 0.87, '#BE185D');
      } else {
        // Classic crisp 64-bit aqua anime eyes + highlight pixel
        drawQuadPixelRect(ctx, q, 0.18, 0.42, 0.35, 0.66, '#0891B2');
        drawQuadPixelRect(ctx, q, 0.18, 0.4, 0.35, 0.47, '#0F172A');
        drawQuadPixelRect(ctx, q, 0.21, 0.47, 0.27, 0.54, '#FFFFFF');

        drawQuadPixelRect(ctx, q, 0.65, 0.42, 0.82, 0.66, '#0891B2');
        drawQuadPixelRect(ctx, q, 0.65, 0.4, 0.82, 0.47, '#0F172A');
        drawQuadPixelRect(ctx, q, 0.68, 0.47, 0.74, 0.54, '#FFFFFF');

        // Mouth: animated singing open mouth when dancing, cute smile otherwise
        if (mode === 'dancing') {
          const mouthOpen = Math.sin(time * 13) > -0.15;
          drawQuadPixelRect(
            ctx,
            q,
            0.42,
            mouthOpen ? 0.74 : 0.77,
            0.58,
            mouthOpen ? 0.89 : 0.83,
            '#E11D48',
          );
        } else {
          drawQuadPixelRect(ctx, q, 0.41, 0.77, 0.59, 0.84, '#0F172A');
        }
      }
    }
  });

  // 64-bit floating cyan pixel musical notes when dancing & singing
  if (mode === 'dancing') {
    for (let i = 0; i < 2; i++) {
      const cycle = (time * 0.9 + i * 0.5) % 1;
      const nx = Math.round(14 + i * 56 + Math.sin(time * 4 + i * 2.5) * 4);
      const ny = Math.round(30 - cycle * 22);
      const alpha = cycle < 0.2 ? cycle / 0.2 : cycle > 0.75 ? (1 - cycle) / 0.25 : 1;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = i === 0 ? '#0284C7' : '#06B6D4';
      // Crisp 64-bit chunky pixel eighth note
      ctx.fillRect(nx, ny + 4, 4, 3);
      ctx.fillRect(nx + 3, ny, 2, 6);
      ctx.fillRect(nx + 3, ny, 5, 2);
      ctx.restore();
    }
  }
}

export function MikuBuddy() {
  const [dismissed, setDismissed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [activeTrackLabel, setActiveTrackLabel] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [overlayAlign, setOverlayAlign] = useState<'left' | 'center' | 'right'>('left');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Mutable 60fps physics + animation refs (zero React re-renders per frame!)
  const posRef = useRef({x: 36, y: 400});
  const velRef = useRef({vx: 52, vy: 0});
  const rotRef = useRef({pitch: 0, yawOffset: 0, roll: 0, rollVel: 0, yawVel: 0});
  const facingRef = useRef<1 | -1>(1);
  const modeRef = useRef<BuddyMode>('walking');
  const musicPlayingRef = useRef(false);
  const doodleIndexRef = useRef(0);
  const drawTimersRef = useRef<number[]>([]);
  const quoteTimerRef = useRef<number | null>(null);

  // Pointer drag/toss state
  const pointerStateRef = useRef<{
    active: boolean;
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    moved: boolean;
    samples: {x: number; y: number; t: number}[];
  }>({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    moved: false,
    samples: [],
  });

  const playRetroChirp = useCallback((freq: number, dur = 0.075, slideTo?: number) => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
      }
      gain.gain.setValueAtTime(0.055, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {
      // ignore audio errors
    }
  }, []);

  const playSingingPhrase = useCallback((notes: number[]) => {
    try {
      const ctx = audioCtxRef.current;
      // Only sing audibly if user has already interacted & unlocked Web Audio
      if (!ctx || ctx.state !== 'running') return;
      notes.forEach((freq, idx) => {
        const start = ctx.currentTime + idx * 0.19;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(0.032, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.17);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.18);
      });
    } catch {
      // ignore audio errors
    }
  }, []);

  const syncOverlayAlign = useCallback(() => {
    const x = posRef.current.x;
    if (x < 100) {
      setOverlayAlign('left');
    } else if (x > window.innerWidth - 190) {
      setOverlayAlign('right');
    } else {
      setOverlayAlign('center');
    }
  }, []);

  const showBubbleQuote = useCallback(
    (text: string, ms = 2400) => {
      syncOverlayAlign();
      setQuote(text);
      if (quoteTimerRef.current) window.clearTimeout(quoteTimerRef.current);
      quoteTimerRef.current = window.setTimeout(() => {
        setQuote((curr) => (curr === text ? null : curr));
      }, ms);
    },
    [syncOverlayAlign],
  );

  // Listen for live MusicRotation playback state so Miku dances automatically!
  useEffect(() => {
    const onMusicState = (ev: Event) => {
      const detail = (
        ev as CustomEvent<{isPlaying: boolean; artist: string; song: string}>
      ).detail;
      if (!detail) return;
      musicPlayingRef.current = detail.isPlaying;
      setMusicPlaying(detail.isPlaying);
      setActiveTrackLabel(detail.song ? `${detail.artist} – ${detail.song}` : '');
      if (detail.isPlaying && modeRef.current === 'walking') {
        modeRef.current = 'dancing';
        showBubbleQuote(`♪ ${detail.song}`, 2600);
      } else if (!detail.isPlaying && modeRef.current === 'dancing') {
        modeRef.current = 'walking';
      }
    };
    window.addEventListener('amka:music-state', onMusicState);
    return () => window.removeEventListener('amka:music-state', onMusicState);
  }, [showBubbleQuote]);

  // Listen for Start Menu & Golden Aero celebration triggers
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('amka:miku-status', {detail: {dismissed}}));
  }, [dismissed]);

  useEffect(() => {
    let celebrateTimer = 0;
    const onCelebrate = () => {
      setDismissed(false);
      modeRef.current = 'dancing';
      velRef.current.vy = -380;
      rotRef.current.yawVel = 7;
      showBubbleQuote('★ GOLDEN AERO PARTY! ★', 4000);
      playSingingPhrase(SINGING_MELODIES[0]);

      celebrateTimer = window.setTimeout(() => {
        if (!musicPlayingRef.current && modeRef.current === 'dancing') {
          modeRef.current = 'walking';
        }
      }, 4200);
    };

    const onMikuSet = (ev: Event) => {
      const detail = (ev as CustomEvent<{dismissed: boolean}>).detail;
      if (detail && typeof detail.dismissed === 'boolean') {
        setDismissed(detail.dismissed);
      }
    };

    window.addEventListener('amka:miku-celebrate', onCelebrate);
    window.addEventListener('amka:miku-set', onMikuSet);
    return () => {
      window.clearTimeout(celebrateTimer);
      window.removeEventListener('amka:miku-celebrate', onCelebrate);
      window.removeEventListener('amka:miku-set', onMikuSet);
    };
  }, [playSingingPhrase, showBubbleQuote]);

  // Spontaneous random singing & dancing intervals while walking around
  useEffect(() => {
    if (dismissed) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let outerTimer = 0;
    let resumeTimer = 0;

    const scheduleSpontaneousDance = () => {
      const delayMs = 8500 + Math.random() * 6500;
      outerTimer = window.setTimeout(() => {
        if (modeRef.current === 'walking' && !musicPlayingRef.current) {
          modeRef.current = 'dancing';
          const lyric = SINGING_LYRICS[Math.floor(Math.random() * SINGING_LYRICS.length)];
          const melody =
            SINGING_MELODIES[Math.floor(Math.random() * SINGING_MELODIES.length)];
          showBubbleQuote(lyric, 3400);
          playSingingPhrase(melody);

          resumeTimer = window.setTimeout(() => {
            if (modeRef.current === 'dancing' && !musicPlayingRef.current) {
              modeRef.current = 'walking';
            }
          }, 3500);
        }
        scheduleSpontaneousDance();
      }, delayMs);
    };

    scheduleSpontaneousDance();
    return () => {
      window.clearTimeout(outerTimer);
      window.clearTimeout(resumeTimer);
    };
  }, [dismissed, playSingingPhrase, showBubbleQuote]);

  // Initialize floor position on mount
  useEffect(() => {
    posRef.current = {
      x: Math.max(20, Math.min(window.innerWidth - BUDDY_SIZE - 24, 36)),
      y: Math.max(60, window.innerHeight - BUDDY_SIZE - 8),
    };
    if (containerRef.current) {
      containerRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
    }
  }, []);

  // Main 60fps 3D Software Rasterizer + Gravity/Toss/Bounce Physics Loop
  useEffect(() => {
    if (dismissed) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rafId = 0;
    let lastTime = performance.now();
    let elapsed = 0;

    const triggerLandingInteractions = (cx: number, cy: number) => {
      // Splash into Aquarium if she lands in the fish tank
      const aqEl = document.getElementById('aquarium');
      if (aqEl) {
        const rect = aqEl.getBoundingClientRect();
        if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
          window.dispatchEvent(new CustomEvent('amka:aquarium-splash', {detail: {clientX: cx, clientY: cy}}));
          showBubbleQuote('Fed the fish! ♪', 2000);
        }
      }
      // Splat paint if she lands in the Aero Paint Pad
      const studioEl = document.getElementById('studio');
      if (studioEl) {
        const rect = studioEl.getBoundingClientRect();
        if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
          window.dispatchEvent(
            new CustomEvent('amka:paint-splash', {detail: {clientX: cx, clientY: cy, color: '#06B6D4'}}),
          );
          showBubbleQuote('Paint splat! ★', 2000);
        }
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += prefersReduced ? 0.005 : dt;

      const maxX = Math.max(12, window.innerWidth - BUDDY_SIZE - 8);
      const floorY = Math.max(40, window.innerHeight - BUDDY_SIZE - 6);
      const p = posRef.current;
      const v = velRef.current;
      const r = rotRef.current;
      const mode = modeRef.current;

      if (!prefersReduced) {
        if (mode === 'airborne') {
          v.vy += 1280 * dt; // Gravity
          v.vx *= Math.pow(0.992, dt * 60);
          p.x += v.vx * dt;
          p.y += v.vy * dt;

          // 3D tumble while flying
          r.roll += r.rollVel * dt;
          r.yawOffset += r.yawVel * dt;
          r.pitch = Math.sin(elapsed * 8) * 0.22;

          // Wall bounces
          if (p.x <= 6) {
            p.x = 6;
            v.vx = Math.abs(v.vx) * 0.65;
            r.rollVel *= -0.7;
            playRetroChirp(340, 0.055, 520);
          } else if (p.x >= maxX) {
            p.x = maxX;
            v.vx = -Math.abs(v.vx) * 0.65;
            r.rollVel *= -0.7;
            playRetroChirp(340, 0.055, 520);
          }

          if (p.y <= 6) {
            p.y = 6;
            v.vy = Math.abs(v.vy) * 0.6;
            playRetroChirp(380, 0.055, 280);
          } else if (p.y >= floorY) {
            p.y = floorY;
            if (Math.abs(v.vy) > 180) {
              v.vy = -v.vy * 0.48;
              v.vx *= 0.78;
              r.rollVel *= 0.6;
              playRetroChirp(260, 0.06, 440);
              triggerLandingInteractions(p.x + BUDDY_SIZE / 2, p.y + BUDDY_SIZE / 2);
            } else {
              // Landed cleanly!
              v.vy = 0;
              v.vx = facingRef.current * 44;
              r.roll = 0;
              r.pitch = 0;
              r.yawOffset = 0;
              r.rollVel = 0;
              r.yawVel = 0;
              modeRef.current = musicPlayingRef.current ? 'dancing' : 'walking';
              triggerLandingInteractions(p.x + BUDDY_SIZE / 2, p.y + BUDDY_SIZE / 2);
            }
          }
        } else if (mode === 'grabbed') {
          // Gently tilt toward drag direction while dangling
          r.roll = Math.max(-0.55, Math.min(0.55, -v.vx * 0.0005));
          r.pitch = 0.14;
        } else if (mode === 'walking' || mode === 'dancing' || mode === 'drawing') {
          // Keep grounded on floor when window resizes
          p.y += (floorY - p.y) * Math.min(1, dt * 12);
          r.roll += (0 - r.roll) * Math.min(1, dt * 10);
          r.pitch += (0 - r.pitch) * Math.min(1, dt * 10);
          r.yawOffset += (0 - r.yawOffset) * Math.min(1, dt * 10);

          if (mode === 'walking') {
            p.x += v.vx * dt;
            if (p.x >= maxX) {
              p.x = maxX;
              v.vx = -Math.abs(v.vx || 46);
              facingRef.current = -1;
            } else if (p.x <= 8) {
              p.x = 8;
              v.vx = Math.abs(v.vx || 46);
              facingRef.current = 1;
            } else {
              facingRef.current = v.vx >= 0 ? 1 : -1;
            }
          }
        }
      } else {
        // Reduced-motion clamp
        p.x = Math.min(Math.max(8, p.x), maxX);
        if (mode !== 'grabbed') p.y = floorY;
      }

      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderMiku64(ctx, {
            time: elapsed,
            mode: modeRef.current,
            facing: facingRef.current,
            pitch: r.pitch,
            yawOffset: r.yawOffset,
            roll: r.roll,
            vx: v.vx,
            vy: v.vy,
          });
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      drawTimersRef.current.forEach((id) => window.clearTimeout(id));
      drawTimersRef.current = [];
      if (quoteTimerRef.current) window.clearTimeout(quoteTimerRef.current);
    };
  }, [dismissed, playRetroChirp, showBubbleQuote]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.setPointerCapture(e.pointerId);
    }
    const p = posRef.current;
    pointerStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - p.x,
      offsetY: e.clientY - p.y,
      moved: false,
      samples: [{x: e.clientX, y: e.clientY, t: performance.now()}],
    };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const ps = pointerStateRef.current;
    if (!ps.active || ps.pointerId !== e.pointerId) return;

    const dist = Math.hypot(e.clientX - ps.startX, e.clientY - ps.startY);
    if (!ps.moved && dist >= 5) {
      ps.moved = true;
      modeRef.current = 'grabbed';
      setMenuOpen(false);
      showBubbleQuote('Whoa!!', 1400);
      playRetroChirp(420, 0.05, 580);
    }

    if (ps.moved) {
      const now = performance.now();
      const maxX = Math.max(12, window.innerWidth - BUDDY_SIZE - 8);
      const maxY = Math.max(12, window.innerHeight - BUDDY_SIZE - 6);
      posRef.current.x = Math.min(Math.max(6, e.clientX - ps.offsetX), maxX);
      posRef.current.y = Math.min(Math.max(6, e.clientY - ps.offsetY), maxY);

      ps.samples.push({x: e.clientX, y: e.clientY, t: now});
      // Keep last 90ms of pointer movement for accurate throw inertia
      ps.samples = ps.samples.filter((s) => now - s.t <= 90);
      if (ps.samples.length >= 2) {
        const first = ps.samples[0];
        const last = ps.samples[ps.samples.length - 1];
        const dtSec = Math.max(0.016, (last.t - first.t) / 1000);
        velRef.current.vx = (last.x - first.x) / dtSec;
        velRef.current.vy = (last.y - first.y) / dtSec;
      }
    }
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const ps = pointerStateRef.current;
    if (!ps.active || ps.pointerId !== e.pointerId) return;
    ps.active = false;

    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    if (!ps.moved) {
      // Clean Tap: Toggle toy action menu + little hop!
      syncOverlayAlign();
      setMenuOpen((prev) => !prev);
      const nextQ = MIKU_QUOTES[Math.floor(Math.random() * MIKU_QUOTES.length)];
      showBubbleQuote(nextQ, 2200);
      playRetroChirp(520, 0.06, 780);
      return;
    }

    // Released after dragging -> Toss physics!
    const vx = Math.max(-1400, Math.min(1400, velRef.current.vx * 0.9));
    const vy = Math.max(-1400, Math.min(1400, velRef.current.vy * 0.9));
    velRef.current.vx = vx;
    velRef.current.vy = vy;
    facingRef.current = vx >= 0 ? 1 : -1;

    // Give her an expressive 64-bit 3D tumble spin proportional to throw power
    rotRef.current.rollVel = Math.max(-9, Math.min(9, vx * 0.008));
    rotRef.current.yawVel = Math.max(-8, Math.min(8, (Math.abs(vx) + Math.abs(vy)) * 0.005));

    modeRef.current = 'airborne';
    playRetroChirp(320, 0.08, 660);

    // Also check if user dropped her right onto Aquarium or Paint Pad
    const cx = posRef.current.x + BUDDY_SIZE / 2;
    const cy = posRef.current.y + BUDDY_SIZE / 2;
    window.dispatchEvent(new CustomEvent('amka:aquarium-splash', {detail: {clientX: cx, clientY: cy}}));
    window.dispatchEvent(
      new CustomEvent('amka:paint-splash', {detail: {clientX: cx, clientY: cy, color: '#06B6D4'}}),
    );
  };

  const handleMikuPlayMusic = () => {
    if (!musicPlaying) {
      window.dispatchEvent(new CustomEvent('amka:music-control', {detail: {action: 'miku'}}));
      modeRef.current = 'dancing';
      showBubbleQuote('Spinning Hatsune Miku ♪', 2400);
      playRetroChirp(587, 0.07, 880);
    } else {
      window.dispatchEvent(new CustomEvent('amka:music-control', {detail: {action: 'toggle'}}));
      modeRef.current = 'walking';
      showBubbleQuote('Music paused', 1600);
    }
  };

  const handleMikuNextSong = () => {
    window.dispatchEvent(new CustomEvent('amka:music-control', {detail: {action: 'next'}}));
    modeRef.current = 'dancing';
    showBubbleQuote('Next track ♪', 2000);
    playRetroChirp(660, 0.07, 990);
  };

  const handleMikuDraw = () => {
    if (isDrawing) return;
    setMenuOpen(false);
    setIsDrawing(true);
    modeRef.current = 'drawing';

    const studioEl = document.getElementById('studio');
    if (studioEl) {
      studioEl.scrollIntoView({behavior: 'smooth', block: 'center'});
    }

    const doodle = DOODLE_LIBRARY[doodleIndexRef.current % DOODLE_LIBRARY.length];
    doodleIndexRef.current += 1;
    showBubbleQuote(`Drawing ${doodle.name}!`, 3000);
    playRetroChirp(523, 0.07, 784);

    // Clear previous draw timers
    drawTimersRef.current.forEach((id) => window.clearTimeout(id));
    drawTimersRef.current = [];

    doodle.strokes.forEach((stroke, idx) => {
      const tId = window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('amka:paint-stroke', {detail: stroke}));
        playRetroChirp(480 + idx * 90, 0.055);
      }, 550 + idx * 450);
      drawTimersRef.current.push(tId);
    });

    const endTimer = window.setTimeout(() => {
      setIsDrawing(false);
      modeRef.current = musicPlayingRef.current ? 'dancing' : 'walking';
      showBubbleQuote('Ta-da! ★', 1800);
    }, 650 + doodle.strokes.length * 450);
    drawTimersRef.current.push(endTimer);
  };

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => setDismissed(false)}
        aria-label="Bring back 64-bit Hatsune Miku buddy"
        className="fixed bottom-3 left-[68px] z-30 inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold aero-btn-silver shadow-md"
      >
        <span className="h-2.5 w-2.5 rounded-sm bg-[#22D3EE]" />
        <span>Call Miku 64</span>
      </button>
    );
  }

  const overlayAlignClass =
    overlayAlign === 'left'
      ? 'left-0 items-start'
      : overlayAlign === 'right'
        ? 'right-0 items-end'
        : 'left-1/2 -translate-x-1/2 items-center';

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-0 z-30 pointer-events-none select-none"
    >
      <div className="relative h-[88px] w-[88px] pointer-events-auto">
        {/* Stacked Non-Overlapping Overlay: Speech Bubble sits cleanly above the Toy Action Bar */}
        {(menuOpen || quote || musicPlaying) && (
          <div
            className={`absolute bottom-full mb-1.5 ${overlayAlignClass} flex flex-col gap-1.5`}
          >
            {(quote || (musicPlaying && !menuOpen)) && (
              <div className="pointer-events-none max-w-[205px] truncate rounded-xl aero-chrome-panel px-2.5 py-1 text-[11px] font-semibold text-[#0C1C2C] dark:text-[#ECF4FD] shadow-md">
                {quote || `♪ ${activeTrackLabel}`}
              </div>
            )}

            {menuOpen && (
              <div className="flex items-center gap-1 rounded-xl aero-chrome-panel p-1 shadow-lg">
                <button
                  type="button"
                  onClick={handleMikuPlayMusic}
                  title={musicPlaying ? 'Pause music' : 'Play music'}
                  className="inline-flex min-h-[40px] sm:min-h-[36px] items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold aero-btn-aqua whitespace-nowrap shrink-0"
                >
                  {musicPlaying ? <Pause className="h-3 w-3" /> : <Music className="h-3 w-3" />}
                  <span>{musicPlaying ? 'Pause' : 'Music'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleMikuNextSong}
                  title="Play next song"
                  className="inline-flex min-h-[40px] sm:min-h-[36px] items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold aero-btn-silver whitespace-nowrap shrink-0"
                >
                  <SkipForward className="h-3 w-3" />
                  <span>Next</span>
                </button>

                <button
                  type="button"
                  onClick={handleMikuDraw}
                  disabled={isDrawing}
                  title="Draw on Paint Pad"
                  className="inline-flex min-h-[40px] sm:min-h-[36px] items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold aero-btn-silver disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Brush className="h-3 w-3 text-[#0284C7] dark:text-[#38BDF8]" />
                  <span>Draw</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDismissed(true)}
                  aria-label="Hide Hatsune Miku buddy"
                  className="inline-flex min-h-[40px] min-w-[36px] sm:min-h-[36px] sm:min-w-[32px] items-center justify-center rounded-lg aero-btn-silver text-[#40566E] dark:text-[#9EB6CF]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 64-Bit N64 Low-Poly Interactive Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_RES}
          height={CANVAS_RES}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label="64-bit interactive Hatsune Miku buddy — drag to toss or tap for music and drawing"
          className="pixelated-64 block h-[88px] w-[88px] cursor-grab active:cursor-grabbing touch-none drop-shadow-[0_4px_8px_rgba(12,28,44,0.28)]"
        />
      </div>
    </div>
  );
}
