import type { Note, Position } from './music';

export type NoteHit = {
  id: number;
  inputId: string;
  position: Position;
  midi: number;
  startedAt: number;
  durationMs: number;
  released: boolean;
};

export type FeedbackClock = {
  now(): number;
  schedule(callback: () => void, delayMs: number): number;
  cancel(timer: number): void;
};

// Feedback has its own clock. Recognition can accept the next fresh attack
// immediately, while the score keeps showing the note that just sounded.
export class NoteFeedback {
  private hit: NoteHit | null = null;
  private timer?: number;
  private serial = 0;

  constructor(
    private emit: (hit: NoteHit | null) => void,
    private clock: FeedbackClock,
  ) {}

  start(position: Position, note: Note, inputId: string) {
    this.clearTimer();
    this.hit = {
      id: ++this.serial,
      inputId,
      position: { ...position },
      midi: note.midi,
      startedAt: this.clock.now(),
      durationMs: note.beats * 480,
      released: false,
    };
    this.emit(this.hit);
  }

  release(inputId: string) {
    if (!this.hit || this.hit.inputId !== inputId || this.hit.released) return;
    const hit = { ...this.hit, released: true };
    this.hit = hit;
    this.emit(hit);
    const remaining = hit.durationMs - (this.clock.now() - hit.startedAt);
    this.timer = this.clock.schedule(
      () => {
        if (this.hit?.id !== hit.id) return;
        this.timer = undefined;
        this.hit = null;
        this.emit(null);
      },
      Math.max(100, remaining),
    );
  }

  cancel() {
    this.clearTimer();
    this.hit = null;
    this.emit(null);
  }

  dispose() {
    this.clearTimer();
    this.hit = null;
  }

  private clearTimer() {
    if (this.timer !== undefined) this.clock.cancel(this.timer);
    this.timer = undefined;
  }
}

// A target is an idle orientation hint, not a metronome for the performance.
export class IdleHint {
  private timer?: number;
  constructor(
    private emit: (visible: boolean) => void,
    private clock: FeedbackClock,
    private delayMs = 1800,
  ) {}

  update(blocked: boolean) {
    this.dispose();
    this.emit(false);
    if (blocked) return;
    this.timer = this.clock.schedule(() => {
      this.timer = undefined;
      this.emit(true);
    }, this.delayMs);
  }

  dispose() {
    if (this.timer !== undefined) this.clock.cancel(this.timer);
    this.timer = undefined;
  }
}
