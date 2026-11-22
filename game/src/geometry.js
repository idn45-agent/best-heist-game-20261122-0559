// Geometry helpers: line of sight and circle-versus-rectangle collision.
// One job: answer "can this see that?" and "does this circle fit here?" for the game.
import { ROOM } from './config.js';

/** True when point (x, y) lies inside rect (with an optional margin). */
export function pointInRect(x, y, rect, margin = 0) {
  return x >= rect.x - margin && x <= rect.x + rect.width + margin &&
    y >= rect.y - margin && y <= rect.y + rect.height + margin;
}

/**
 * True when the segment from (x1, y1) to (x2, y2) is blocked by any rectangle in
 * `obstacles`. Samples the segment finely, which is exact enough for vision cones
 * and far simpler than an analytic segment-rectangle test.
 */
export function segmentBlocked(x1, y1, x2, y2, obstacles) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(distance / 5));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const x = x1 + dx * t;
    const y = y1 + dy * t;
    for (let j = 0; j < obstacles.length; j += 1) {
      if (pointInRect(x, y, obstacles[j])) return true;
    }
  }
  return false;
}

/** True when the segment from the watcher to the target crosses no obstacle. */
export function hasLineOfSight(x1, y1, x2, y2, obstacles) {
  return !segmentBlocked(x1, y1, x2, y2, obstacles);
}

/** True when point (x, y) lies inside the smoke cloud. */
export function pointInSmoke(x, y, smokes) {
  for (let i = 0; i < smokes.length; i += 1) {
    const smoke = smokes[i];
    if (Math.hypot(x - smoke.x, y - smoke.y) < smoke.radius) return true;
  }
  return false;
}

/**
 * Push circle (x, y, radius) out of the room walls and every obstacle rect.
 * Returns the corrected position; the circle slides along walls instead of sticking.
 */
export function resolveCircleCollision(x, y, radius, obstacles) {
  let nx = Math.max(ROOM.x + radius, Math.min(ROOM.x + ROOM.width - radius, x));
  let ny = Math.max(ROOM.y + radius, Math.min(ROOM.y + ROOM.height - radius, y));
  for (let i = 0; i < obstacles.length; i += 1) {
    const rect = obstacles[i];
    const closestX = Math.max(rect.x, Math.min(nx, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(ny, rect.y + rect.height));
    const dx = nx - closestX;
    const dy = ny - closestY;
    const distance = Math.hypot(dx, dy);
    if (distance >= radius) continue;
    if (distance === 0) {
      // Centre inside the rect: push out along the smallest penetration axis.
      const left = nx - rect.x;
      const right = rect.x + rect.width - nx;
      const top = ny - rect.y;
      const bottom = rect.y + rect.height - ny;
      const min = Math.min(left, right, top, bottom);
      if (min === left) nx = rect.x - radius;
      else if (min === right) nx = rect.x + rect.width + radius;
      else if (min === top) ny = rect.y - radius;
      else ny = rect.y + rect.height + radius;
    } else {
      nx = closestX + (dx / distance) * radius;
      ny = closestY + (dy / distance) * radius;
    }
  }
  return { x: nx, y: ny };
}
