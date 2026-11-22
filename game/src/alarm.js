// The alarm meter: the game's heartbeat.
// One job: rise while anyone sees the thief, fall while hidden, and say when it is too late.
import { ALARM } from './config.js';

/**
 * Advance the alarm one step. `riseRate` is the fastest watcher currently seeing
 * the thief (0 when nobody does). Returns 'caught' the moment the meter fills.
 */
export function updateAlarm(world, riseRate, dt) {
  if (riseRate > 0) {
    world.alarm = Math.min(ALARM.max, world.alarm + riseRate * dt);
  } else {
    world.alarm = Math.max(0, world.alarm - ALARM.decayPerSecond * dt);
  }
  world.alarmPeak = Math.max(world.alarmPeak, world.alarm);
  if (world.alarm >= ALARM.max) return 'caught';
  return null;
}

/** The meter's colour: green while calm, amber while watched, red near the top. */
export function alarmColour(alarm) {
  if (alarm < 40) return '#58c96b';
  if (alarm < 75) return '#e8b23a';
  return '#e5484d';
}

/** True while the meter is high enough that the room should feel dangerous. */
export function alarmIsHot(alarm) {
  return alarm >= ALARM.warningAt;
}
