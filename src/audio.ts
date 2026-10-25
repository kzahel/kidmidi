import type { Note } from './music';

// A tiny local preview voice. The physical piano supplies its own live sound.
export class PianoAudio {
  private context?: AudioContext;
  private voices = new Map<
    string,
    { oscillator: OscillatorNode; gain: GainNode }
  >();

  play(id: string, midi: number, when?: number, duration?: number) {
    this.context ??= new AudioContext();
    void this.context.resume();
    this.stop(id);
    const context = this.context;
    const start = when ?? context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.17, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.045, start + 0.35);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    this.voices.set(id, { oscillator, gain });
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      if (this.voices.get(id)?.oscillator === oscillator)
        this.voices.delete(id);
    };
    if (duration !== undefined) {
      gain.gain.setTargetAtTime(0, start + duration, 0.035);
      oscillator.stop(start + duration + 0.2);
    }
  }

  stop(id: string) {
    const voice = this.voices.get(id);
    if (!voice || !this.context) return;
    voice.gain.gain.cancelScheduledValues(this.context.currentTime);
    voice.gain.gain.setTargetAtTime(0, this.context.currentTime, 0.015);
    voice.oscillator.stop(this.context.currentTime + 0.08);
    this.voices.delete(id);
  }

  stopAll() {
    for (const id of this.voices.keys()) this.stop(id);
  }

  hear(notes: Note[]) {
    this.stopAll();
    this.context ??= new AudioContext();
    let time = this.context.currentTime + 0.08;
    notes.forEach((note, index) => {
      this.play(`preview-${index}`, note.midi, time, note.beats * 0.48 - 0.04);
      time += note.beats * 0.48;
    });
  }

  close() {
    this.stopAll();
    void this.context?.close();
  }
}
