// The gallery guards: patrol, scan, investigate, chase, and see.
// One job: everything a guard does, including the vision cone the thief must read.
import { GUARD_CHASE_ALARM, GUARD_TOUCH_RADIUS, GUARD_VISION } from './config.js';
import { angleDifference, turnToward } from './config.js';
import { hasLineOfSight, pointInSmoke, resolveCircleCollision } from './geometry.js';

export function createGuard(definition) {
  return {
    name: definition.name,
    x: definition.x,
    y: definition.y,
    direction: definition.direction,
    baseSpeed: definition.speed,
    speed: definition.speed,
    waypoints: definition.waypoints,
    waypointIndex: 0,
    waitTimeLeft: 0,
    scanPhase: 0,
    mode: 'patrol',
    investigateTarget: null,
    investigateTimeLeft: 0,
    seesPlayer: false,
    suspicion: 0,
  };
}

/**
 * Can this guard see the thief right now? Range, cone, line of sight, smoke —
 * and a sneaking thief is harder to spot at the edge of the cone.
 */
export function guardSeesPlayer(guard, player, world) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const distance = Math.hypot(dx, dy);
  const range = player.sneaking ? GUARD_VISION.range * 0.7 : GUARD_VISION.range;
  if (distance > range) return { sees: false, closeness: 0 };
  const angleToPlayer = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(guard.direction, angleToPlayer)) > GUARD_VISION.halfAngle) {
    return { sees: false, closeness: 0 };
  }
  if (!hasLineOfSight(guard.x, guard.y, player.x, player.y, world.level.obstacles)) {
    return { sees: false, closeness: 0 };
  }
  if (pointInSmoke(player.x, player.y, world.smokes)) return { sees: false, closeness: 0 };
  return { sees: true, closeness: 1 - distance / range };
}

/** Move one step toward a point at the guard's speed, facing the way he walks. */
function walkToward(guard, target, dt, world, speedMultiplier = 1) {
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 2) return true;
  const targetDirection = Math.atan2(dy, dx);
  guard.direction = turnToward(guard.direction, targetDirection, 6 * dt);
  const step = guard.speed * speedMultiplier * dt;
  const next = resolveCircleCollision(
    guard.x + (dx / distance) * step,
    guard.y + (dy / distance) * step,
    16,
    world.level.obstacles,
  );
  guard.x = next.x;
  guard.y = next.y;
  return distance < step + 2;
}

/**
 * Advance one guard. Returns 'touch' when he lays a hand on the thief —
 * the one unfair-looking moment that is actually fair: he was visible all along.
 */
export function updateGuard(guard, player, dt, world) {
  // Vision first: it decides the mode.
  const sight = guardSeesPlayer(guard, player, world);
  guard.seesPlayer = sight.sees;
  if (sight.sees) guard.suspicion = Math.min(1, guard.suspicion + dt * 2);
  else guard.suspicion = Math.max(0, guard.suspicion - dt * 0.8);

  // A lure coin pulls the nearest guard off his patrol to look.
  if (guard.mode !== 'investigate') {
    for (const lure of world.lures) {
      if (Math.hypot(lure.x - guard.x, lure.y - guard.y) < 340) {
        guard.mode = 'investigate';
        guard.investigateTarget = { x: lure.x, y: lure.y };
        guard.investigateTimeLeft = 3;
        break;
      }
    }
  }

  if (world.alarm >= GUARD_CHASE_ALARM && guard.mode !== 'investigate') {
    guard.mode = 'chase';
  } else if (world.alarm < GUARD_CHASE_ALARM && guard.mode === 'chase') {
    guard.mode = 'patrol';
  }

  if (guard.mode === 'investigate' && guard.investigateTarget) {
    const arrived = walkToward(guard, guard.investigateTarget, dt, world, 1.25);
    if (arrived) {
      guard.investigateTimeLeft -= dt;
      guard.scanPhase += dt;
      guard.direction += Math.sin(guard.scanPhase * 2.2) * 1.6 * dt;
      if (guard.investigateTimeLeft <= 0) {
        guard.mode = 'patrol';
        guard.investigateTarget = null;
        // Resume the patrol from the nearest waypoint.
        let nearest = 0;
        let nearestDistance = Infinity;
        guard.waypoints.forEach((point, index) => {
          const d = Math.hypot(point.x - guard.x, point.y - guard.y);
          if (d < nearestDistance) {
            nearestDistance = d;
            nearest = index;
          }
        });
        guard.waypointIndex = nearest;
      }
    }
    return checkTouch(guard, player);
  }

  if (guard.mode === 'chase') {
    walkToward(guard, player, dt, world, 1.45);
    return checkTouch(guard, player);
  }

  // Patrol: walk the waypoints, pause at each end and scan the room.
  if (guard.waitTimeLeft > 0) {
    guard.waitTimeLeft -= dt;
    guard.scanPhase += dt;
    guard.direction += Math.sin(guard.scanPhase * 1.8) * 1.4 * dt;
    return checkTouch(guard, player);
  }
  const target = guard.waypoints[guard.waypointIndex];
  const arrived = walkToward(guard, target, dt, world, 1);
  if (arrived) {
    guard.waitTimeLeft = 1.2;
    guard.scanPhase = 0;
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
  }
  return checkTouch(guard, player);
}

function checkTouch(guard, player) {
  return Math.hypot(guard.x - player.x, guard.y - player.y) < GUARD_TOUCH_RADIUS ? 'touch' : null;
}

/** How fast the alarm rises from this guard's view of the thief (0 when blind). */
export function guardAlarmRate(guard, player, world) {
  const sight = guardSeesPlayer(guard, player, world);
  if (!sight.sees) return 0;
  const rate = GUARD_VISION.alarmRate * (0.35 + 0.85 * sight.closeness);
  return player.sneaking ? rate * 0.5 : rate;
}

/** Speed the guards up after the Sapphire trips the silent alarm. */
export function enrageGuards(guards) {
  for (const guard of guards) guard.speed = guard.baseSpeed * 1.18;
}
