// Bootstrap: canvas, the frame loop, and the ?shot= staging hook for screenshots.
// One job: start the game and keep it ticking at the display's refresh rate.
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config.js';
import { createGame, stepGame } from './game.js';
import { Input } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const world = createGame();
// Exposed for play-testing and debugging from the browser console.
window.__velvetVault = { world, input };

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  // A staged screenshot: place the real game, draw one frame, and stop.
  // The frame is the game itself — same state, same renderer, no mockup.
  stageShot(shot, world);
  render(ctx, world);
} else {
  let lastTime = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    stepGame(world, input, dt);
    render(ctx, world);
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
