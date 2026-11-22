// The Gilded Gallery: one room, three routes, built from data.
// One job: describe the room — walls of cover, loot, patrols, cameras, spawn and exit —
// so the game logic never hard-codes a coordinate.
import { ROOM } from './config.js';

/**
 * Build a fresh level. Every coordinate is inside ROOM.
 *
 * Routes through the room:
 * - West aisle (left): display cases for cover, watched by the west wall camera.
 * - Centre: the red carpet straight to the vault, crossed by Sofia's patrol.
 * - East aisle (right): pillars and a bench for cover, watched by the corner camera.
 * The thief enters at the south-west door and must leave by the same door with the Sapphire.
 */
export function buildLevel() {
  const obstacles = [
    // Two long display cases form the middle band; they are the room's main cover.
    { x: 210, y: 330, width: 190, height: 58, kind: 'case', label: 'Jewels of the Old Court' },
    { x: 880, y: 330, width: 190, height: 58, kind: 'case', label: 'Masks of the River Kings' },
    // The central plinth: the room's landmark, and the best hiding spot in the middle.
    { x: 592, y: 318, width: 96, height: 96, kind: 'plinth', label: 'The Dancer' },
    // Four marble pillars break the sight-lines down each aisle.
    { x: 408, y: 196, width: 38, height: 38, kind: 'pillar' },
    { x: 834, y: 196, width: 38, height: 38, kind: 'pillar' },
    { x: 408, y: 486, width: 38, height: 38, kind: 'pillar' },
    { x: 834, y: 486, width: 38, height: 38, kind: 'pillar' },
    // Benches along the side walls, low cover for a crouched thief.
    { x: 96, y: 428, width: 92, height: 40, kind: 'bench' },
    { x: 1092, y: 428, width: 92, height: 40, kind: 'bench' },
    // The vault case itself: solid glass and gold, and the reason for the job.
    { x: 590, y: 128, width: 100, height: 52, kind: 'vault' },
  ];

  const loot = [
    {
      id: 'sapphire', name: 'The Star Sapphire', x: 640, y: 154,
      kind: 'sapphire', value: 5000, required: true,
    },
    {
      id: 'moon', name: 'The Velvet Moon', x: 176, y: 236,
      kind: 'painting', value: 800, required: false,
    },
    {
      id: 'ibis', name: 'The Golden Ibis', x: 1104, y: 292,
      kind: 'statue', value: 800, required: false,
    },
  ];

  const guards = [
    {
      name: 'Marco', x: 320, y: 150, direction: 0, speed: 56,
      waypoints: [{ x: 300, y: 150 }, { x: 980, y: 150 }],
    },
    {
      name: 'Sofia', x: 640, y: 262, direction: Math.PI / 2, speed: 48,
      waypoints: [{ x: 640, y: 262 }, { x: 640, y: 560 }],
    },
    {
      name: 'Ravi', x: 260, y: 586, direction: 0, speed: 62,
      waypoints: [{ x: 260, y: 586 }, { x: 1020, y: 586 }],
    },
  ];

  const cameras = [
    // North-east corner camera, sweeping the east aisle and the vault approach.
    { name: 'Cam NE', x: ROOM.x + ROOM.width - 14, y: ROOM.y + 14, baseAngle: Math.PI * 0.75, sweep: 0.55, sweepSpeed: 0.55 },
    // West wall camera, sweeping the west aisle and the moon painting.
    { name: 'Cam W', x: ROOM.x + 14, y: 392, baseAngle: 0, sweep: 0.7, sweepSpeed: 0.45 },
  ];

  return {
    obstacles,
    loot,
    guards,
    cameras,
    spawn: { x: 108, y: 636 },
    // The south-west door: entry and getaway. The van waits outside it.
    exit: { x: 64, y: ROOM.y + ROOM.height - 34, width: 88, height: 34 },
    carpet: { x: 596, y: 180, width: 88, height: 448 },
  };
}
