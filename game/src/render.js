// Everything the player sees: the gallery, the cones, the thief, the HUD, the screens.
// One job: draw the world state onto the canvas, in layers, with no game logic.
import { ALARM, CANVAS_HEIGHT, CANVAS_WIDTH, GUARD_VISION, CAMERA_VISION, PALETTE, PLAYER, ROOM } from './config.js';
import { alarmColour } from './alarm.js';

/** Draw a vision cone: a soft wedge of light, red and pulsing while it sees the thief. */
function drawCone(ctx, x, y, direction, halfAngle, range, rgb, alpha, seeing) {
  const gradient = ctx.createRadialGradient(x, y, 8, x, y, range);
  const strong = seeing ? Math.min(0.55, alpha + 0.22) : alpha;
  gradient.addColorStop(0, `rgba(${rgb}, ${strong})`);
  gradient.addColorStop(0.7, `rgba(${rgb}, ${alpha * 0.55})`);
  gradient.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, direction - halfAngle, direction + halfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(${rgb}, ${seeing ? 0.5 : 0.22})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, direction - halfAngle, direction + halfAngle);
  ctx.closePath();
  ctx.stroke();
}

function drawFloor(ctx, level) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // Checkerboard floor, dim so the cones and the carpet read first.
  const tile = 76;
  for (let y = ROOM.y; y < ROOM.y + ROOM.height; y += tile) {
    for (let x = ROOM.x; x < ROOM.x + ROOM.width; x += tile) {
      const odd = (Math.floor((x - ROOM.x) / tile) + Math.floor((y - ROOM.y) / tile)) % 2 === 0;
      ctx.fillStyle = odd ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  // The red carpet: the boldest route to the vault, and the most watched one.
  const carpet = level.carpet;
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(carpet.x, carpet.y, carpet.width, carpet.height);
  ctx.strokeStyle = PALETTE.carpetTrim;
  ctx.lineWidth = 3;
  ctx.strokeRect(carpet.x + 2, carpet.y + 2, carpet.width - 4, carpet.height - 4);
  // Room border with a gold trim.
  ctx.strokeStyle = PALETTE.wallTrim;
  ctx.lineWidth = 6;
  ctx.strokeRect(ROOM.x - 3, ROOM.y - 3, ROOM.width + 6, ROOM.height + 6);
}

function drawObstacles(ctx, level) {
  for (const obstacle of level.obstacles) {
    if (obstacle.kind === 'case' || obstacle.kind === 'vault') {
      ctx.fillStyle = PALETTE.caseFrame;
      ctx.fillRect(obstacle.x - 3, obstacle.y - 3, obstacle.width + 6, obstacle.height + 6);
      ctx.fillStyle = PALETTE.caseGlass;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, 10);
      if (obstacle.label) {
        ctx.fillStyle = '#d8c26a';
        ctx.font = '11px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(obstacle.label, obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height + 15);
      }
    } else if (obstacle.kind === 'plinth') {
      ctx.fillStyle = PALETTE.marble;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.fillStyle = '#c7ccd8';
      ctx.fillRect(obstacle.x + 6, obstacle.y + 6, obstacle.width - 12, obstacle.height - 12);
      ctx.fillStyle = '#5a3d6e';
      ctx.beginPath();
      ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2 - 6, 16, 0, Math.PI * 2);
      ctx.fill();
    } else if (obstacle.kind === 'pillar') {
      ctx.fillStyle = PALETTE.pillar;
      ctx.beginPath();
      ctx.arc(obstacle.x + 19, obstacle.y + 19, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8b93a8';
      ctx.beginPath();
      ctx.arc(obstacle.x + 19, obstacle.y + 19, 13, 0, Math.PI * 2);
      ctx.fill();
    } else if (obstacle.kind === 'bench') {
      ctx.fillStyle = '#5d4326';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.fillStyle = '#7a5a34';
      ctx.fillRect(obstacle.x + 4, obstacle.y + 4, obstacle.width - 8, obstacle.height - 8);
    }
  }
}

function drawLoot(ctx, level, lootTaken, time) {
  for (const item of level.loot) {
    if (lootTaken[item.id]) continue;
    const pulse = 0.5 + 0.5 * Math.sin(time * 3 + item.x);
    // Glow ring so loot reads from across the room.
    const glow = ctx.createRadialGradient(item.x, item.y, 4, item.x, item.y, 44 + pulse * 10);
    glow.addColorStop(0, 'rgba(255, 217, 77, 0.5)');
    glow.addColorStop(1, 'rgba(255, 217, 77, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 44 + pulse * 10, 0, Math.PI * 2);
    ctx.fill();
    if (item.kind === 'sapphire') {
      ctx.fillStyle = PALETTE.sapphire;
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 18);
      ctx.lineTo(item.x + 15, item.y);
      ctx.lineTo(item.x, item.y + 18);
      ctx.lineTo(item.x - 15, item.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 18);
      ctx.lineTo(item.x + 15, item.y);
      ctx.lineTo(item.x, item.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e8e4d2';
      ctx.font = 'bold 13px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ THE STAR SAPPHIRE ★', item.x, item.y - 30);
    } else if (item.kind === 'painting') {
      ctx.fillStyle = '#8a6d2f';
      ctx.fillRect(item.x - 26, item.y - 20, 52, 40);
      ctx.fillStyle = '#2c1e4a';
      ctx.fillRect(item.x - 21, item.y - 15, 42, 30);
      ctx.fillStyle = '#e8d8a8';
      ctx.beginPath();
      ctx.arc(item.x + 8, item.y - 4, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a1f2b';
      ctx.fillRect(item.x - 21, item.y + 8, 42, 7);
      ctx.fillStyle = '#e8e4d2';
      ctx.font = '11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.name, item.x, item.y + 36);
    } else {
      ctx.fillStyle = PALETTE.lootGlow;
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 16);
      ctx.lineTo(item.x + 10, item.y + 8);
      ctx.lineTo(item.x - 10, item.y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(item.x - 14, item.y + 8, 28, 6);
      ctx.fillStyle = '#e8e4d2';
      ctx.font = '11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.name, item.x, item.y + 34);
    }
  }
}

function drawExit(ctx, level, sapphireTaken, time) {
  const exit = level.exit;
  const open = sapphireTaken;
  ctx.fillStyle = open ? '#1d5c2e' : '#3a3f55';
  ctx.fillRect(exit.x, exit.y, exit.width, exit.height);
  ctx.strokeStyle = open ? '#58c96b' : '#8b93a8';
  ctx.lineWidth = 3;
  ctx.strokeRect(exit.x, exit.y, exit.width, exit.height);
  ctx.fillStyle = open ? '#b8f5c4' : '#c9c4b2';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'GETAWAY VAN →' : 'EXIT · VAN', exit.x + exit.width / 2, exit.y + 21);
  if (open) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 4);
    ctx.strokeStyle = `rgba(88, 201, 107, ${0.4 + pulse * 0.5})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(exit.x - 6, exit.y - 6, exit.width + 12, exit.height + 12);
  }
  ctx.fillStyle = '#c9c4b2';
  ctx.font = '11px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ENTER HERE', exit.x + 4, exit.y - 8);
}

function drawGuards(ctx, guards, time) {
  for (const guard of guards) {
    const range = GUARD_VISION.range;
    drawCone(ctx, guard.x, guard.y, guard.direction, GUARD_VISION.halfAngle, range,
      guard.seesPlayer ? GUARD_CONE_SEEN : GUARD_CONE, 0.16, guard.seesPlayer);
    // Body: navy uniform, gold cap band, facing tick.
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.guardTrim;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = PALETTE.guardTrim;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 16, guard.direction - 0.7, guard.direction + 0.7);
    ctx.lineTo(guard.x, guard.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f2ead8';
    ctx.beginPath();
    ctx.arc(guard.x + Math.cos(guard.direction) * 20, guard.y + Math.sin(guard.direction) * 20, 3, 0, Math.PI * 2);
    ctx.fill();
    // "!" while he sees the thief, "?" while suspicious.
    if (guard.seesPlayer || guard.suspicion > 0.35) {
      ctx.font = 'bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = guard.seesPlayer ? '#ff5040' : '#e8b23a';
      ctx.fillText(guard.seesPlayer ? '!' : '?', guard.x, guard.y - 26);
    }
    ctx.fillStyle = '#c9c4b2';
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(guard.name, guard.x, guard.y + 30);
  }
}

const GUARD_CONE = '255, 190, 90';
const GUARD_CONE_SEEN = '255, 60, 50';

function drawCameras(ctx, cameras) {
  for (const camera of cameras) {
    const disabled = camera.disabledTimeLeft > 0;
    if (!disabled) {
      drawCone(ctx, camera.x, camera.y, camera.direction, CAMERA_VISION.halfAngle,
        CAMERA_VISION.range, CAMERA_VISION_CONE, 0.14, camera.seesPlayer);
    }
    ctx.fillStyle = disabled ? '#4a4f63' : '#20242f';
    ctx.fillRect(camera.x - 9, camera.y - 7, 18, 14);
    ctx.strokeStyle = disabled ? '#6a6f83' : '#e5484d';
    ctx.lineWidth = 2;
    ctx.strokeRect(camera.x - 9, camera.y - 7, 18, 14);
    ctx.fillStyle = disabled ? '#6a6f83' : '#ff5a4d';
    ctx.beginPath();
    ctx.arc(camera.x + Math.cos(camera.direction) * 10, camera.y + Math.sin(camera.direction) * 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c9c4b2';
    ctx.font = '10px Georgia, serif';
    if (camera.x > CANVAS_WIDTH - 70) {
      ctx.textAlign = 'right';
      ctx.fillText(disabled ? 'CAM OFF' : camera.name, camera.x - 14, camera.y + 24);
    } else if (camera.x < 70) {
      ctx.textAlign = 'left';
      ctx.fillText(disabled ? 'CAM OFF' : camera.name, camera.x + 14, camera.y + 24);
    } else {
      ctx.textAlign = 'center';
      ctx.fillText(disabled ? 'CAM OFF' : camera.name, camera.x, camera.y + 24);
    }
  }
}

const CAMERA_VISION_CONE = '255, 80, 80';

function drawPlayer(ctx, player, time) {
  // Sneak ring: a dashed circle while crouched, so the player can tell at a glance.
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(232, 232, 240, 0.45)';
    ctx.setLineDash([4, 5]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  const radius = player.sneaking ? 11 : PLAYER.radius;
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.playerTrim;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Hood point and mask stripe, facing the walk direction.
  ctx.fillStyle = PALETTE.playerTrim;
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.direction) * (radius - 2),
    player.y + Math.sin(player.direction) * (radius - 2), 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Grab progress ring.
  if (player.grabTarget && player.grabProgress > 0) {
    ctx.strokeStyle = PALETTE.lootGlow;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 24, -Math.PI / 2, -Math.PI / 2 + player.grabProgress * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#e8e4d2';
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('picking the lock…', player.x, player.y - 32);
  }
}

function drawEffects(ctx, world, time) {
  for (const smoke of world.smokes) {
    const alpha = Math.min(0.75, smoke.timeLeft);
    ctx.fillStyle = `rgba(190, 190, 205, ${alpha * 0.55})`;
    ctx.beginPath();
    ctx.arc(smoke.x, smoke.y, smoke.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(220, 220, 235, ${alpha * 0.35})`;
    ctx.beginPath();
    ctx.arc(smoke.x - 18, smoke.y + 10, smoke.radius * 0.55, 0, Math.PI * 2);
    ctx.arc(smoke.x + 20, smoke.y - 12, smoke.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const lure of world.lures) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 6);
    ctx.strokeStyle = `rgba(255, 217, 77, ${0.5 + pulse * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lure.x, lure.y, 10 + pulse * 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.lootGlow;
    ctx.beginPath();
    ctx.arc(lure.x, lure.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const particle of world.particles) {
    ctx.fillStyle = particle.colour;
    ctx.globalAlpha = Math.max(0, particle.timeLeft / particle.life);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/** The HUD strip: alarm meter, loot, tools, timer, objective. Always on top. */
function drawHud(ctx, world) {
  ctx.fillStyle = 'rgba(16, 18, 28, 0.92)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 84);
  ctx.strokeStyle = PALETTE.wallTrim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 84);
  ctx.lineTo(CANVAS_WIDTH, 84);
  ctx.stroke();

  // Objective, left.
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('THE VELVET VAULT', 24, 26);
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = '#b8b4a2';
  const objective = world.lootTaken.sapphire
    ? 'Sapphire secured — reach the GETAWAY VAN door!'
    : 'Steal the Star Sapphire, then reach the van.';
  ctx.fillText(objective, 24, 48);
  ctx.fillText('WASD move · Shift sneak · E grab · 1 smoke · 2 EMP · 3 / click lure · P pause', 24, 68);

  // Alarm meter, centre.
  const meterX = 470;
  const meterY = 22;
  const meterWidth = 340;
  ctx.fillStyle = '#e8e4d2';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', meterX, meterY - 6);
  ctx.fillStyle = '#262a3a';
  ctx.fillRect(meterX, meterY, meterWidth, 22);
  const colour = alarmColour(world.alarm);
  ctx.fillStyle = colour;
  ctx.fillRect(meterX, meterY, meterWidth * (world.alarm / ALARM.max), 22);
  ctx.strokeStyle = '#e8e4d2';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(meterX, meterY, meterWidth, 22);
  // Tick at the chase threshold so the player can see it coming.
  ctx.strokeStyle = '#e8e4d2';
  ctx.beginPath();
  ctx.moveTo(meterX + meterWidth * 0.85, meterY - 3);
  ctx.lineTo(meterX + meterWidth * 0.85, meterY + 25);
  ctx.stroke();
  ctx.fillStyle = '#b8b4a2';
  ctx.font = '12px Georgia, serif';
  ctx.fillText(world.alarm >= ALARM.warningAt ? 'SPOTTED — break line of sight!' : 'Unseen. Stay out of the cones.', meterX, meterY + 40);

  // Loot and tools, right.
  const rightX = CANVAS_WIDTH - 24;
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 14px Georgia, serif';
  const lootText = `◆ Sapphire ${world.lootTaken.sapphire ? '✓' : '·'}   ◐ Moon ${world.lootTaken.moon ? '✓' : '·'}   ▲ Ibis ${world.lootTaken.ibis ? '✓' : '·'}`;
  ctx.fillText(lootText, rightX, 26);
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = '#b8b4a2';
  ctx.fillText(`Tools — [1] smoke ×${world.player.tools.smoke}  [2] EMP ×${world.player.tools.emp}  [3] lure ×${world.player.tools.lure}`, rightX, 48);
  const minutes = Math.floor(world.time / 60);
  const seconds = Math.floor(world.time % 60);
  ctx.fillText(`Time ${minutes}:${String(seconds).padStart(2, '0')}   Score ${world.score}`, rightX, 68);

  // Flash the whole frame red while the alarm is hot.
  if (world.alarm >= ALARM.warningAt) {
    const pulse = 0.06 + 0.05 * Math.sin(world.time * 6);
    ctx.fillStyle = `rgba(229, 72, 77, ${pulse})`;
    ctx.fillRect(0, 84, CANVAS_WIDTH, CANVAS_HEIGHT - 84);
  }
}

function drawMessage(ctx, world) {
  if (world.messageTimeLeft <= 0 || !world.message) return;
  ctx.font = 'bold 15px Georgia, serif';
  const width = Math.min(CANVAS_WIDTH - 48, ctx.measureText(world.message).width + 36);
  const boxX = (CANVAS_WIDTH - width) / 2;
  ctx.fillStyle = 'rgba(16, 18, 28, 0.88)';
  ctx.fillRect(boxX, CANVAS_HEIGHT - 60, width, 34);
  ctx.strokeStyle = PALETTE.wallTrim;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(boxX, CANVAS_HEIGHT - 60, width, 34);
  ctx.fillStyle = '#f2ead8';
  ctx.textAlign = 'center';
  ctx.fillText(world.message, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 38);
}

function overlay(ctx, colour, title, lines, hint) {
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, CANVAS_WIDTH / 2, 250);
  ctx.font = '20px Georgia, serif';
  lines.forEach((line, index) => {
    ctx.fillText(line, CANVAS_WIDTH / 2, 310 + index * 34);
  });
  ctx.font = '16px Georgia, serif';
  ctx.fillStyle = '#c9c4b2';
  ctx.fillText(hint, CANVAS_WIDTH / 2, 310 + lines.length * 34 + 30);
}

function drawTitle(ctx) {
  ctx.fillStyle = '#14161f';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // A painted title backdrop: the vault case, a cone, and the thief's silhouette.
  const glow = ctx.createRadialGradient(640, 300, 10, 640, 300, 260);
  glow.addColorStop(0, 'rgba(89, 216, 255, 0.25)');
  glow.addColorStop(1, 'rgba(89, 216, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 72px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE VELVET VAULT', CANVAS_WIDTH / 2, 190);
  ctx.fillStyle = '#c9a227';
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText('A midnight heist in the Gilded Gallery', CANVAS_WIDTH / 2, 235);
  ctx.fillStyle = '#e8e4d2';
  ctx.font = '18px Georgia, serif';
  const lines = [
    'Cross one room. Read the cones. Take the Star Sapphire.',
    'Guards patrol, cameras sweep — the alarm meter is your heartbeat.',
    'Smoke, EMP and lure coins are limited: spend them like money.',
    '',
    'WASD / arrows — move      Shift — sneak (harder to spot)',
    'E — hold to pick a lock      1 — smoke bomb      2 — EMP      3 / click — toss a lure coin',
    'P — pause      M — mute      R — restart',
  ];
  lines.forEach((line, index) => {
    ctx.fillText(line, CANVAS_WIDTH / 2, 300 + index * 30);
  });
  const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 350);
  ctx.fillStyle = `rgba(255, 217, 77, ${pulse})`;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('Press ENTER or click to begin the heist', CANVAS_WIDTH / 2, 560);
}

/** Draw the whole game: world layers, then HUD, then any message or end screen. */
export function render(ctx, world) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (world.screen === 'title') {
    drawTitle(ctx);
    return;
  }
  drawFloor(ctx, world.level);
  drawObstacles(ctx, world.level);
  drawLoot(ctx, world.level, world.lootTaken, world.time);
  drawExit(ctx, world.level, world.lootTaken.sapphire, world.time);
  drawCameras(ctx, world.cameras);
  drawGuards(ctx, world.guards, world.time);
  drawPlayer(ctx, world.player, world.time);
  drawEffects(ctx, world, world.time);
  drawHud(ctx, world);
  drawMessage(ctx, world);
  if (world.screen === 'paused') {
    overlay(ctx, 'rgba(10, 12, 20, 0.72)', 'PAUSED', ['The gallery waits. The guards do not sleep.'], 'Press P to keep moving');
  } else if (world.screen === 'caught') {
    overlay(ctx, 'rgba(90, 10, 12, 0.82)', 'CAUGHT!',
      [`${world.caughtBy} — the alarm hit ${Math.round(world.alarmPeak)}%.`,
        `Loot taken: ${world.lootCount} piece${world.lootCount === 1 ? '' : 's'} · Time in the gallery: ${formatTime(world.time)}`,
        `Score ${world.score} — the Sapphire is still in its case.`],
      'Press R to plan the next attempt');
  } else if (world.screen === 'getaway') {
    overlay(ctx, 'rgba(20, 50, 20, 0.82)', 'CLEAN GETAWAY!',
      [`The van pulls away with the Star Sapphire.`,
        `Loot ${world.score - world.timeBonus} · Time bonus ${world.timeBonus} · Alarm peaked at ${Math.round(world.alarmPeak)}%`,
        `Final score: ${world.score}`],
      'Press R to run it again, faster and quieter');
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}
