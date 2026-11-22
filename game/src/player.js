// The thief: movement, sneaking, grabbing loot, and the three tools.
// One job: everything the player does, and what each tool costs.
import { ALARM, PLAYER, TOOLS } from './config.js';
import { pointInRect, resolveCircleCollision } from './geometry.js';

export function createPlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    radius: PLAYER.radius,
    direction: -Math.PI / 2,
    moving: false,
    sneaking: false,
    grabProgress: 0,
    grabTarget: null,
    tools: { smoke: TOOLS.smoke.count, emp: TOOLS.emp.count, lure: TOOLS.lure.count },
  };
}

/** The nearest loot the thief can grab from here, or null. */
export function nearestGrabbableLoot(player, loot, taken) {
  let best = null;
  let bestDistance = Infinity;
  for (const item of loot) {
    if (taken[item.id]) continue;
    const distance = Math.hypot(item.x - player.x, item.y - player.y);
    if (distance < PLAYER.grabRange && distance < bestDistance) {
      best = item;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Move the thief one step and advance a loot grab. Returns events the game turns
 * into sound and messages: { grabbed, sapphireTripped, toolUsed, toolFailed }.
 */
export function updatePlayer(player, input, dt, world) {
  const events = { grabbed: null, sapphireTripped: false, toolUsed: null, toolFailed: null };
  const move = input.moveVector();
  player.moving = move.x !== 0 || move.y !== 0;
  player.sneaking = input.sneaking;
  const speed = player.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  if (player.moving) {
    player.direction = Math.atan2(move.y, move.x);
    const next = resolveCircleCollision(
      player.x + move.x * speed * dt,
      player.y + move.y * speed * dt,
      player.radius,
      world.level.obstacles,
    );
    player.x = next.x;
    player.y = next.y;
    player.grabProgress = 0;
    player.grabTarget = null;
  }

  // Grabbing loot: hold E beside it. Moving cancels the grab.
  const loot = nearestGrabbableLoot(player, world.level.loot, world.lootTaken);
  if (loot && input.down('e')) {
    player.grabTarget = loot;
    player.grabProgress += dt / PLAYER.grabSeconds;
    if (player.grabProgress >= 1) {
      world.lootTaken[loot.id] = true;
      events.grabbed = loot;
      player.grabProgress = 0;
      player.grabTarget = null;
      if (loot.required) events.sapphireTripped = true;
    }
  } else {
    player.grabProgress = 0;
    player.grabTarget = loot && input.down('e') ? loot : null;
  }

  // Tools. Each one costs a limited use, and smoke and EMP make a little noise.
  if (input.wasPressed(TOOLS.smoke.key)) {
    if (player.tools.smoke > 0) {
      player.tools.smoke -= 1;
      world.smokes.push({ x: player.x, y: player.y, radius: TOOLS.smoke.radius, timeLeft: TOOLS.smoke.seconds });
      world.alarm = Math.min(ALARM.max, world.alarm + ALARM.toolNoise);
      events.toolUsed = 'smoke';
    } else {
      events.toolFailed = 'smoke';
    }
  }
  if (input.wasPressed(TOOLS.emp.key)) {
    if (player.tools.emp > 0) {
      player.tools.emp -= 1;
      for (const camera of world.cameras) camera.disabledTimeLeft = TOOLS.emp.seconds;
      world.alarm = Math.min(ALARM.max, world.alarm + ALARM.toolNoise);
      events.toolUsed = 'emp';
    } else {
      events.toolFailed = 'emp';
    }
  }
  const lurePressed = input.wasPressed(TOOLS.lure.key) || input.mouse.clicked;
  if (lurePressed) {
    if (player.tools.lure > 0) {
      player.tools.lure -= 1;
      const target = input.mouse.clicked
        ? { x: input.mouse.clickX, y: input.mouse.clickY }
        : {
          x: player.x + Math.cos(player.direction) * TOOLS.lure.throwDistance,
          y: player.y + Math.sin(player.direction) * TOOLS.lure.throwDistance,
        };
      world.lures.push({ x: target.x, y: target.y, timeLeft: TOOLS.lure.investigateSeconds });
      events.toolUsed = 'lure';
    } else {
      events.toolFailed = 'lure';
    }
  }
  return events;
}

/** True when the thief stands in the getaway door with the Sapphire. */
export function atExitDoor(player, level) {
  return pointInRect(player.x, player.y, level.exit);
}
