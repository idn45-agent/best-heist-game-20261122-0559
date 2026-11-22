// The wall cameras: sweep, watch, and go dark under an EMP.
// One job: the camera's cone, its sweep pattern, and whether it sees the thief.
import { CAMERA_VISION } from './config.js';
import { angleDifference } from './config.js';
import { hasLineOfSight, pointInSmoke } from './geometry.js';

export function createCamera(definition) {
  return {
    name: definition.name,
    x: definition.x,
    y: definition.y,
    baseAngle: definition.baseAngle,
    sweep: definition.sweep,
    sweepSpeed: definition.sweepSpeed,
    sweepTime: 0,
    direction: definition.baseAngle,
    disabledTimeLeft: 0,
    seesPlayer: false,
  };
}

/** The camera's current facing angle: a slow sine sweep around its mount. */
export function cameraAngle(camera) {
  return camera.baseAngle + Math.sin(camera.sweepTime * camera.sweepSpeed) * camera.sweep;
}

/** Advance the sweep and the EMP countdown. */
export function updateCamera(camera, dt) {
  camera.sweepTime += dt;
  if (camera.disabledTimeLeft > 0) camera.disabledTimeLeft -= dt;
  camera.direction = cameraAngle(camera);
}

/** Can this camera see the thief right now? */
export function cameraSeesPlayer(camera, player, world) {
  if (camera.disabledTimeLeft > 0) return { sees: false, closeness: 0 };
  const dx = player.x - camera.x;
  const dy = player.y - camera.y;
  const distance = Math.hypot(dx, dy);
  const range = player.sneaking ? CAMERA_VISION.range * 0.7 : CAMERA_VISION.range;
  if (distance > range) return { sees: false, closeness: 0 };
  const angleToPlayer = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(camera.direction, angleToPlayer)) > CAMERA_VISION.halfAngle) {
    return { sees: false, closeness: 0 };
  }
  if (!hasLineOfSight(camera.x, camera.y, player.x, player.y, world.level.obstacles)) {
    return { sees: false, closeness: 0 };
  }
  if (pointInSmoke(player.x, player.y, world.smokes)) return { sees: false, closeness: 0 };
  return { sees: true, closeness: 1 - distance / range };
}

/** How fast the alarm rises from this camera's view of the thief (0 when blind). */
export function cameraAlarmRate(camera, player, world) {
  const sight = cameraSeesPlayer(camera, player, world);
  if (!sight.sees) return 0;
  const rate = CAMERA_VISION.alarmRate * (0.35 + 0.85 * sight.closeness);
  return player.sneaking ? rate * 0.5 : rate;
}
