import { PianoAudio } from './audio';
import type { PlayedNote } from './explore';
export type PlaybackState = {
  playing: boolean;
  notes: PlayedNote[];
  active: Set<number>;
};
export const emptyPlayback: PlaybackState = {
  playing: false,
  notes: [],
  active: new Set(),
};
export class RecordingPlayer {
  private audio = new PianoAudio();
  private timer?: ReturnType<typeof setTimeout>;
  private started = 0;
  private notes: PlayedNote[] = [];
  private index = 0;
  private active = new Map<number, PlayedNote>();
  playing = false;
  constructor(private emit: (state: PlaybackState) => void) {}
  play(notes: PlayedNote[]) {
    this.stop();
    if (!notes.length) return;
    notes = [...notes].sort((a, b) => a.onsetMs - b.onsetMs);
    const first = notes[0].onsetMs;
    this.notes = notes.map((note) => ({
      ...note,
      onsetMs: note.onsetMs - first,
      offsetMs: (note.offsetMs ?? note.onsetMs + 300) - first,
    }));
    this.started = performance.now();
    this.index = 0;
    this.playing = true;
    this.step();
  }
  private step = () => {
    const elapsed = performance.now() - this.started;
    let changed = false;
    while (
      this.index < this.notes.length &&
      this.notes[this.index].onsetMs <= elapsed
    ) {
      const note = this.notes[this.index++];
      this.active.set(note.id, note);
      this.audio.play(
        `recording-${note.id}`,
        note.midi,
        undefined,
        Math.max(
          0.03,
          ((note.offsetMs ?? note.onsetMs + 300) - note.onsetMs) / 1000,
        ),
        note.velocity,
      );
      changed = true;
    }
    for (const [id, note] of this.active)
      if ((note.offsetMs ?? 0) <= elapsed) {
        this.active.delete(id);
        changed = true;
      }
    if (this.index >= this.notes.length && !this.active.size)
      this.playing = false;
    if (changed || !this.playing) {
      const latestGroup = this.notes[this.index - 1]?.groupIndex ?? 0;
      let first = this.index;
      while (
        first > 0 &&
        (this.notes[first - 1].groupIndex ?? 0) >= latestGroup - 31
      )
        first--;
      this.emit({
        playing: this.playing,
        notes: this.notes.slice(first, this.index),
        active: new Set([...this.active.values()].map((note) => note.midi)),
      });
    }
    if (this.playing) this.timer = setTimeout(this.step, 20);
  };
  stop() {
    clearTimeout(this.timer);
    this.playing = false;
    this.audio.stopAll();
    this.active.clear();
    this.emit({ ...emptyPlayback, active: new Set() });
  }
  dispose() {
    this.stop();
    this.audio.close();
  }
}
