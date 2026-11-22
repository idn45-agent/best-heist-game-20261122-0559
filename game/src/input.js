// Keyboard and mouse input, polled once per frame by the game.
// One job: turn raw DOM events into a small, testable input state.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };
    this.canvas = canvas;

    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(event.key.toLowerCase());
      this.keys.add(event.key.toLowerCase());
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key.toLowerCase());
    });
    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
      this.mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
    });
    canvas.addEventListener('mousedown', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.clickX = (event.clientX - rect.left) * (canvas.width / rect.width);
      this.mouse.clickY = (event.clientY - rect.top) * (canvas.height / rect.height);
      this.mouse.clicked = true;
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
  }

  /** True while the key is held down. */
  down(key) {
    return this.keys.has(key.toLowerCase());
  }

  /** True only on the frame the key went down. Consumed by endFrame(). */
  wasPressed(key) {
    return this.pressed.has(key.toLowerCase());
  }

  /** Movement vector from WASD / arrows, normalised. */
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.down('a') || this.down('arrowleft')) x -= 1;
    if (this.down('d') || this.down('arrowright')) x += 1;
    if (this.down('w') || this.down('arrowup')) y -= 1;
    if (this.down('s') || this.down('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      const length = Math.hypot(x, y);
      x /= length;
      y /= length;
    }
    return { x, y };
  }

  get sneaking() {
    return this.down('shift');
  }

  /** Clear per-frame presses and the mouse click after the game has read them. */
  endFrame() {
    this.pressed.clear();
    this.mouse.clicked = false;
  }
}
