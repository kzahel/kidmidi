import type { FeedbackClock } from './feedback';

export type DanceMove =
  | 'hop'
  | 'leap'
  | 'echo'
  | 'twirl'
  | 'spin'
  | 'flip'
  | 'backflip'
  | 'tiptoe';
export type Dance = {
  id: number;
  move: DanceMove;
  label: string;
  direction: number;
  lift: number;
};
const labels: Record<DanceMove, string> = {
  hop: 'With you',
  leap: 'Octave leap!',
  echo: 'Echo hops!',
  twirl: 'Twirl!',
  spin: 'Star spin!',
  flip: 'Scale flip!',
  backflip: 'Backflip!',
  tiptoe: 'Tiptoe!',
};

// A small, live-only musical memory. No recording, assessment or currency enters
// here. Input routing owns fresh note-ons; releases never create dance steps.
export class CompanionDance {
  private history: number[] = [];
  private lastAt = -Infinity;
  private groupAt = -Infinity;
  private groupPitches = new Set<number>();
  private dance: Dance | null = null;
  private timer?: number;
  private serial = 0;

  constructor(
    private emit: (dance: Dance | null) => void,
    private clock: FeedbackClock,
  ) {}

  noteOn(pitch: number, now = this.clock.now()) {
    if (now - this.lastAt > 10000) this.history = [];
    // Simultaneous notes are a chord, not a fast melodic scale/arpeggio.
    const chord = now - this.groupAt <= 80 && !this.groupPitches.has(pitch);
    if (chord) this.history = [];
    else {
      this.groupAt = now;
      this.groupPitches.clear();
    }
    this.groupPitches.add(pitch);
    const previous = this.history.at(-1) ?? pitch;
    this.history = [...this.history, pitch].slice(-8);
    this.lastAt = now;
    const move = chord ? 'hop' : discover(this.history);
    const direction = Math.sign(pitch - previous);
    let steps = 0;
    for (let i = this.history.length - 1; i > 0; i--) {
      const interval = this.history[i] - this.history[i - 1];
      if (interval < 1 || interval > 2) break;
      steps++;
    }
    if (move !== 'hop') this.history = [pitch];
    // Let a discovered trick finish even if the child keeps playing.
    if (this.dance && this.dance.move !== 'hop') return;
    this.clearTimer();
    const dance = {
      id: ++this.serial,
      move,
      label: labels[move],
      direction,
      lift: Math.min(steps, 4),
    };
    this.dance = dance;
    this.emit(dance);
    this.timer = this.clock.schedule(
      () => {
        this.timer = undefined;
        this.dance = null;
        this.emit(null);
      },
      move === 'hop' ? 550 : 1400,
    );
  }

  reset() {
    this.dispose();
    this.emit(null);
  }

  dispose() {
    this.clearTimer();
    this.history = [];
    this.lastAt = this.groupAt = -Infinity;
    this.groupPitches.clear();
    this.dance = null;
  }

  private clearTimer() {
    if (this.timer !== undefined) this.clock.cancel(this.timer);
    this.timer = undefined;
  }
}

function discover(notes: number[]): DanceMove {
  const matches = (shape: number[]) => {
    const tail = notes.slice(-shape.length);
    return (
      tail.length === shape.length &&
      tail.every((pitch, index) => pitch - tail[0] === shape[index])
    );
  };
  for (const scale of [
    [0, 2, 4, 5, 7, 9, 11, 12],
    [0, 2, 3, 5, 7, 8, 10, 12],
  ]) {
    if (matches(scale)) return 'flip';
    if (matches([...scale].reverse().map((pitch) => pitch - 12)))
      return 'backflip';
  }
  if (
    matches([0, 4, 7, 12]) ||
    matches([0, 3, 7, 12]) ||
    matches([0, -5, -8, -12]) ||
    matches([0, -5, -9, -12])
  )
    return 'spin';
  if (matches([0, 1, 2, 3, 4, 5]) || matches([0, -1, -2, -3, -4, -5]))
    return 'tiptoe';
  if (matches([0, 0, 0, 0])) return 'echo';
  const tail = notes.slice(-5);
  if (
    tail.length === 5 &&
    tail[0] !== tail[1] &&
    tail.every((pitch, index) => pitch === tail[index % 2])
  )
    return 'twirl';
  if (notes.length >= 2 && Math.abs(notes.at(-1)! - notes.at(-2)!) === 12)
    return 'leap';
  return 'hop';
}
