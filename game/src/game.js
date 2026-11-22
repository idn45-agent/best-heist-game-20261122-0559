// The game itself: state, the per-frame step, and the win / lose rules.
// One job: own the world and advance it one frame at a time.
import { ALARM, LOOT_VALUES, TIME_BONUS_PAR_SECONDS, TIME_BONUS_PER_SECOND, mulberry32 } from './config.js';
import { buildLevel } from './level.js';
import { createPlayer, updatePlayer, atExitDoor } from './player.js';
import { createGuard, updateGuard, guardAlarmRate, enrageGuards } from './guard.js';
import { createCamera, updateCamera, cameraAlarmRate, cameraSeesPlayer } from './camera.js';
import { updateAlarm } from './alarm.js';
import { SoundBank } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_GETAWAY = 'getaway';

/** A fresh world: a new gallery, a new thief, a quiet alarm. */
export function createGame() {
  const level = buildLevel();
  return {
    screen: SCREEN_TITLE,
    level,
    player: createPlayer(level.spawn),
    guards: level.guards.map(createGuard),
    cameras: level.cameras.map(createCamera),
    lootTaken: {},
    lootCount: 0,
    smokes: [],
    lures: [],
    particles: [],
    alarm: 0,
    alarmPeak: 0,
    time: 0,
    score: 0,
    timeBonus: 0,
    message: '',
    messageTimeLeft: 0,
    caughtBy: '',
    sound: new SoundBank(),
    random: mulberry32(7),
    alarmTickTime: 0,
    spottedAnnounced: false,
  };
}

export function showMessage(world, text, seconds = 3) {
  world.message = text;
  world.messageTimeLeft = seconds;
}

function burst(world, x, y, colour, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = world.random() * Math.PI * 2;
    const speed = 30 + world.random() * 70;
    world.particles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      size: 2 + world.random() * 3, colour, life: 0.7, timeLeft: 0.7,
    });
  }
}

/**
 * Advance the world one frame. `input` is the polled keyboard/mouse state.
 * Returns nothing; the screen field says what happened.
 */
export function stepGame(world, input, dt) {
  if (world.screen === SCREEN_TITLE) {
    if (input.wasPressed('enter') || input.mouse.clicked) {
      world.screen = SCREEN_PLAY;
      world.sound.ensure();
      showMessage(world, 'Stay out of the cones. The Sapphire waits upstairs.', 4);
    }
    return;
  }
  if (world.screen === SCREEN_PAUSED) {
    if (input.wasPressed('p') || input.wasPressed('escape')) world.screen = SCREEN_PLAY;
    if (input.wasPressed('r')) resetGame(world);
    return;
  }
  if (world.screen === SCREEN_CAUGHT || world.screen === SCREEN_GETAWAY) {
    if (input.wasPressed('r') || input.wasPressed('enter')) resetGame(world);
    return;
  }

  // In play: pause, mute, restart.
  if (input.wasPressed('p') || input.wasPressed('escape')) {
    world.screen = SCREEN_PAUSED;
    return;
  }
  if (input.wasPressed('m')) world.sound.toggleMute();
  if (input.wasPressed('r')) {
    resetGame(world);
    return;
  }

  world.time += dt;
  if (world.messageTimeLeft > 0) world.messageTimeLeft -= dt;

  // The thief moves, grabs, and spends tools.
  const events = updatePlayer(world.player, input, dt, world);
  if (events.grabbed) {
    const loot = events.grabbed;
    world.lootCount += 1;
    world.score += loot.value;
    burst(world, loot.x, loot.y, '#ffd94d', 18);
    if (loot.required) {
      world.sound.sapphire();
      world.alarm = Math.min(ALARM.max, world.alarm + ALARM.sapphireTrip);
      enrageGuards(world.guards);
      showMessage(world, 'The Star Sapphire is yours — but its silent alarm is tripped! Run!', 4);
    } else {
      world.sound.pickup();
      showMessage(world, `${loot.name} pocketed (+${loot.value}).`, 2.5);
    }
  }
  if (events.toolUsed === 'smoke') {
    world.sound.tool();
    showMessage(world, 'Smoke out — they cannot see through it.', 2);
  }
  if (events.toolUsed === 'emp') {
    world.sound.tool();
    showMessage(world, 'Cameras dark for 8 seconds. Move!', 2.5);
  }
  if (events.toolUsed === 'lure') {
    world.sound.tool();
    showMessage(world, 'A coin skitters across the marble…', 2);
  }
  if (events.toolFailed) {
    showMessage(world, `No ${events.toolFailed} left — spend tools like money.`, 2);
  }

  // Guards and cameras watch, and the alarm answers them.
  let riseRate = 0;
  let watcher = '';
  for (const guard of world.guards) {
    const touch = updateGuard(guard, world.player, dt, world);
    if (touch === 'touch') {
      endCaught(world, `A guard laid a hand on you`);
      return;
    }
    const rate = guardAlarmRate(guard, world.player, world);
    if (rate > riseRate) {
      riseRate = rate;
      watcher = guard.name;
    }
  }
  for (const camera of world.cameras) {
    updateCamera(camera, dt);
    camera.seesPlayer = cameraSeesPlayer(camera, world.player, world).sees;
    const rate = cameraAlarmRate(camera, world.player, world);
    if (rate > riseRate) {
      riseRate = rate;
      watcher = camera.name;
    }
  }

  // Alarm ticks and the "spotted" sting, so the meter is heard as well as seen.
  if (world.alarm >= ALARM.warningAt && riseRate > 0) {
    world.alarmTickTime -= dt;
    if (world.alarmTickTime <= 0) {
      world.sound.alarmTick();
      world.alarmTickTime = 0.45;
    }
  }
  if (riseRate > 0 && !world.spottedAnnounced) {
    world.spottedAnnounced = true;
    world.sound.spotted();
    showMessage(world, `${watcher} has eyes on you — break line of sight!`, 2.5);
  }
  if (riseRate === 0) world.spottedAnnounced = false;

  if (updateAlarm(world, riseRate, dt) === 'caught') {
    endCaught(world, watcher ? `${watcher} held you in sight too long` : 'The alarm hit 100%');
    return;
  }

  // Smoke and lures fade; particles drift.
  for (const smoke of world.smokes) smoke.timeLeft -= dt;
  world.smokes = world.smokes.filter((smoke) => smoke.timeLeft > 0);
  for (const lure of world.lures) lure.timeLeft -= dt;
  world.lures = world.lures.filter((lure) => lure.timeLeft > 0);
  for (const particle of world.particles) {
    particle.timeLeft -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
  }
  world.particles = world.particles.filter((particle) => particle.timeLeft > 0);

  // The payoff: Sapphire in hand, thief at the van door.
  if (world.lootTaken.sapphire && atExitDoor(world.player, world.level)) {
    world.timeBonus = Math.max(0, Math.round((TIME_BONUS_PAR_SECONDS - world.time) * TIME_BONUS_PER_SECOND));
    world.score += world.timeBonus;
    world.screen = SCREEN_GETAWAY;
    world.sound.getaway();
  }
}

function endCaught(world, reason) {
  world.screen = SCREEN_CAUGHT;
  world.caughtBy = reason;
  world.sound.spotted();
}

/** Start over: same gallery, fresh thief, quiet alarm. */
export function resetGame(world) {
  const fresh = createGame();
  fresh.screen = SCREEN_PLAY;
  Object.keys(world).forEach((key) => {
    delete world[key];
  });
  Object.assign(world, fresh);
}
