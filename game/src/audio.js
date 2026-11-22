// Synthesised sound: every effect is a small WebAudio oscillator, no audio files.
// One job: make the heist audible — pickup chimes, alarm ticks, the caught sting.
export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
  }

  /** Create the audio context on the first user gesture; browsers require that. */
  ensure() {
    if (!this.context) {
      try {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        this.context = null;
      }
    }
    if (this.context && this.context.state === 'suspended') this.context.resume();
    return this.context;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /** One short note: frequency, duration, wave shape, and volume. */
  note(frequency, seconds, type = 'sine', volume = 0.08, when = 0) {
    if (this.muted) return;
    const context = this.ensure();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    const start = context.currentTime + when;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.05);
  }

  pickup() {
    this.note(660, 0.12, 'triangle', 0.09);
    this.note(990, 0.18, 'triangle', 0.09, 0.09);
  }

  sapphire() {
    this.note(523, 0.14, 'triangle', 0.1);
    this.note(659, 0.14, 'triangle', 0.1, 0.1);
    this.note(784, 0.22, 'triangle', 0.1, 0.2);
    this.note(1046, 0.3, 'sine', 0.08, 0.3);
  }

  tool() {
    this.note(220, 0.1, 'square', 0.05);
    this.note(180, 0.14, 'square', 0.05, 0.08);
  }

  alarmTick() {
    this.note(880, 0.07, 'square', 0.04);
  }

  spotted() {
    this.note(196, 0.25, 'sawtooth', 0.09);
    this.note(147, 0.4, 'sawtooth', 0.09, 0.18);
  }

  getaway() {
    const notes = [523, 659, 784, 1046, 1318];
    notes.forEach((frequency, index) => {
      this.note(frequency, 0.22, 'triangle', 0.1, index * 0.12);
    });
  }
}
