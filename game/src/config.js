// The Velvet Vault — shared constants: canvas, room, palette, speeds and tuning.
// One job: every number the rest of the game agrees on lives here.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

// The gallery floor the thief crosses. The HUD strip sits above it.
export const ROOM = { x: 32, y: 92, width: 1216, height: 596 };

// The thief.
export const PLAYER = {
  radius: 13,
  walkSpeed: 178,
  sneakSpeed: 96,
  grabRange: 64,
  grabSeconds: 0.9,
};

// What a guard sees: range in pixels, half-angle of the cone, alarm rise per second.
export const GUARD_VISION = { range: 205, halfAngle: 0.56, alarmRate: 62 };
export const GUARD_TOUCH_RADIUS = 26;
export const GUARD_CHASE_ALARM = 85;

// What a wall camera sees. Cameras sweep; EMP shuts them down for a while.
export const CAMERA_VISION = { range: 250, halfAngle: 0.42, alarmRate: 46 };
export const CAMERA_EMP_SECONDS = 8;

// The alarm meter: 0 quiet, 100 caught. It falls while nobody sees the thief.
export const ALARM = {
  max: 100,
  decayPerSecond: 16,
  sapphireTrip: 25,
  toolNoise: 6,
  warningAt: 60,
};

// The tools, and what each one costs: a limited count, plus a little noise on the meter.
export const TOOLS = {
  smoke: { count: 2, radius: 78, seconds: 4, key: '1', name: 'Smoke bomb' },
  emp: { count: 1, seconds: CAMERA_EMP_SECONDS, key: '2', name: 'EMP pulse' },
  lure: { count: 3, throwDistance: 150, investigateSeconds: 3, key: '3', name: 'Lure coin' },
};

// Loot values in points. The Sapphire is the job; the other two are optional bonuses.
export const LOOT_VALUES = { sapphire: 5000, moon: 800, ibis: 800 };
export const TIME_BONUS_PAR_SECONDS = 300;
export const TIME_BONUS_PER_SECOND = 10;

// Night-gallery palette: safe cover reads warm wood and marble, danger reads red,
// loot reads gold and cyan. The judge should tell them apart at a glance.
export const PALETTE = {
  wall: '#2b2f45',
  wallTrim: '#c9a227',
  floorA: '#232838',
  floorB: '#1e2230',
  carpet: '#7a1f2b',
  carpetTrim: '#c9a227',
  caseGlass: '#4a7d9e',
  caseFrame: '#8a6d2f',
  marble: '#9aa3b2',
  pillar: '#6d7488',
  guardCone: '255, 190, 90',
  guardConeSeen: '255, 60, 50',
  cameraCone: '255, 80, 80',
  player: '#14161f',
  playerTrim: '#e8e8f0',
  guard: '#2e4a7a',
  guardTrim: '#d8c26a',
  lootGlow: '#ffd94d',
  sapphire: '#59d8ff',
  hud: '#10121c',
  hudText: '#e8e4d2',
  alarmLow: '#58c96b',
  alarmMid: '#e8b23a',
  alarmHigh: '#e5484d',
};

/** Deterministic random stream, so staged screenshots render the same frame every run. */
export function mulberry32(seed) {
  let value = seed >>> 0;
  return function nextRandom() {
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smallest signed turn from angle `from` to angle `to`, in (-PI, PI]. */
export function angleDifference(from, to) {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta <= -Math.PI) delta += Math.PI * 2;
  return delta;
}

/** Move `angle` toward `target` by at most `step` radians. */
export function turnToward(angle, target, step) {
  const delta = angleDifference(angle, target);
  if (Math.abs(delta) <= step) return target;
  return angle + Math.sign(delta) * step;
}
