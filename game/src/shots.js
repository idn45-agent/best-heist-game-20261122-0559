// Staged screenshot scenes behind ?shot=cover|sneak|caught|getaway.
// One job: put the real game into a readable, honest frame — the same world, the same
// renderer, placed by hand so the cover shows the whole heist in one frame.
import { SCREEN_CAUGHT, SCREEN_GETAWAY, SCREEN_PLAY, createGame, showMessage } from './game.js';

/**
 * Stage `world` into the named scene and return the screen to draw.
 * Every scene is a legal game state: guards on patrol, cones sweeping, loot glowing.
 */
export function stageShot(name, world) {
  const fresh = createGame();
  Object.keys(world).forEach((key) => { delete world[key]; });
  Object.assign(world, fresh);
  world.screen = SCREEN_PLAY;

  if (name === 'sneak') {
    // The thief crouched at the vault itself, lock half-picked on the Star Sapphire,
    // while Marco closes in from the top corridor and the alarm runs hot.
    world.player.x = 640;
    world.player.y = 208;
    world.player.direction = -Math.PI / 2;
    world.player.sneaking = true;
    world.player.grabProgress = 0.55;
    world.player.grabTarget = world.level.loot[0];
    world.guards[0].x = 780;
    world.guards[0].y = 150;
    world.guards[0].direction = Math.PI;
    world.guards[0].seesPlayer = false;
    world.guards[1].x = 640;
    world.guards[1].y = 430;
    world.guards[1].direction = -Math.PI / 2;
    world.guards[2].x = 800;
    world.guards[2].y = 586;
    world.guards[2].direction = Math.PI;
    world.cameras[0].sweepTime = 2.2;
    world.cameras[1].sweepTime = 1.1;
    world.alarm = 72;
    world.alarmPeak = 72;
    world.time = 118;
    world.score = 800;
    world.lootTaken.moon = true;
    world.lootCount = 1;
    showMessage(world, 'Marco is turning — hold still or slip behind the case!', 99);
    return;
  }

  if (name === 'caught') {
    // The fair caught moment: the alarm filled while Sofia held the thief in sight.
    world.screen = SCREEN_CAUGHT;
    world.player.x = 640;
    world.player.y = 470;
    world.player.direction = -Math.PI / 2;
    world.guards[1].x = 640;
    world.guards[1].y = 410;
    world.guards[1].direction = Math.PI / 2;
    world.guards[1].seesPlayer = true;
    world.guards[0].x = 500;
    world.guards[0].y = 150;
    world.guards[0].direction = Math.PI / 2;
    world.guards[2].x = 900;
    world.guards[2].y = 586;
    world.guards[2].direction = Math.PI;
    world.cameras[0].sweepTime = 2.2;
    world.cameras[1].sweepTime = 1.1;
    world.alarm = 100;
    world.alarmPeak = 100;
    world.time = 142;
    world.score = 800;
    world.lootTaken.moon = true;
    world.lootCount = 1;
    world.caughtBy = 'Sofia held you in sight too long';
    return;
  }

  if (name === 'getaway') {
    // The payoff: Sapphire taken, thief at the van door, guards too late.
    world.screen = SCREEN_GETAWAY;
    world.player.x = 108;
    world.player.y = 648;
    world.player.direction = Math.PI;
    world.guards[0].x = 420;
    world.guards[0].y = 150;
    world.guards[0].direction = Math.PI;
    world.guards[1].x = 640;
    world.guards[1].y = 300;
    world.guards[1].direction = Math.PI / 2;
    world.guards[2].x = 500;
    world.guards[2].y = 586;
    world.guards[2].direction = -Math.PI / 2;
    world.cameras[0].sweepTime = 0.4;
    world.cameras[1].sweepTime = 2.6;
    world.alarm = 41;
    world.alarmPeak = 88;
    world.time = 187;
    world.score = 6930;
    world.timeBonus = 1130;
    world.lootTaken.sapphire = true;
    world.lootTaken.moon = true;
    world.lootTaken.ibis = true;
    world.lootCount = 3;
    return;
  }

  // Default: the cover. The whole heist in one frame — the thief sneaking past the
  // west case while Marco's cone sweeps the carpet, the corner camera watches the
  // vault, the Sapphire glows, and the alarm sits at a tense 38%.
  world.player.x = 300;
  world.player.y = 440;
  world.player.direction = -Math.PI / 2;
  world.player.sneaking = true;
  world.guards[0].x = 500;
  world.guards[0].y = 150;
  world.guards[0].direction = 0.4;
  world.guards[1].x = 640;
  world.guards[1].y = 470;
  world.guards[1].direction = -Math.PI / 2;
  world.guards[1].seesPlayer = false;
  world.guards[2].x = 700;
  world.guards[2].y = 586;
  world.guards[2].direction = Math.PI;
  world.cameras[0].sweepTime = 1.6;
  world.cameras[1].sweepTime = 0.2;
  world.alarm = 38;
  world.alarmPeak = 38;
  world.time = 64;
  world.score = 0;
  showMessage(world, 'Stay out of the cones. The Sapphire waits upstairs.', 99);
}
