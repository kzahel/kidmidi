import { lessons } from './lesson-catalog';

// Curriculum policy is independent of storage, React and MIDI transport.
export const curriculum = [60, 64, 67, 62, 65, 69, 71, 72] as const;
export type LearningReason = 'review' | 'practice' | 'introduce' | 'chosen';
export type Encounter = {
  id: string;
  learnerId: string;
  startedAt: number;
  day: string;
  target: number;
  spelling: string;
  guesses: number[];
  firstResponseMs: number | null;
  durationMs: number | null;
  assistance: 'note-name' | 'none';
  input: 'midi' | 'pointer' | 'computer' | 'mixed';
  reason: LearningReason;
  reward: number;
  lesson?: { id: string; revision: number; runId: string; index: number };
};
export type LearningClock = {
  now(): number;
  monotonic(): number;
};
export const browserClock: LearningClock = {
  now: () => Date.now(),
  monotonic: () => performance.now(),
};

export function learningDay(at: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at);
  return ['year', 'month', 'day']
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join('-');
}

function singleNoteHistory(history: Encounter[]) {
  return history.filter(
    (event) =>
      !lessons.some(
        (lesson) => lesson.id === event.lesson?.id && lesson.patterns,
      ),
  );
}

export function noteEvidence(history: Encounter[], target: number) {
  history = singleNoteHistory(history);
  const recent = history.filter((event) => event.target === target).slice(-12);
  const correct = recent.filter((event) => event.guesses.length === 1);
  const days = new Set(correct.map((event) => event.day)).size;
  const accuracy = recent.length ? correct.length / recent.length : 0;
  const times = correct
    .map((event) => event.firstResponseMs)
    .filter((time): time is number => time !== null)
    .sort((a, b) => a - b);
  return {
    seen: recent.length,
    accuracy,
    days,
    medianMs: times.length ? times[Math.floor(times.length / 2)] : null,
    ready: recent.length >= 6 && days >= 3 && accuracy >= 0.8,
  };
}

export function advanceCurriculum(unlocked: number, history: Encounter[]) {
  const count = Math.min(curriculum.length, Math.max(3, unlocked));
  return count < curriculum.length &&
    curriculum
      .slice(0, count)
      .every((note) => noteEvidence(history, note).ready)
    ? count + 1
    : count;
}

export type LearningChoice = {
  target: number;
  reason: LearningReason;
  detail: string;
};

export function chooseExercise(
  history: Encounter[],
  unlocked: number,
  day: string,
  previous: number | null = null,
  random: () => number = Math.random,
): LearningChoice {
  const notes = curriculum.slice(
    0,
    Math.max(3, Math.min(unlocked, curriculum.length)),
  );
  history = singleNoteHistory(history);
  // Freeze the review list using earlier days only. Reloads and mode changes
  // resume it; today's new evidence cannot keep adding more review cards.
  const before = history.filter((event) => event.day < day);
  const review = notes
    .filter((note) => before.some((event) => event.target === note))
    .sort((a, b) => {
      const accuracy =
        noteEvidence(before, a).accuracy - noteEvidence(before, b).accuracy;
      return (
        accuracy ||
        (before.filter((event) => event.target === a).at(-1)?.startedAt ?? 0) -
          (before.filter((event) => event.target === b).at(-1)?.startedAt ?? 0)
      );
    })
    .slice(0, 3)
    .filter(
      (note) =>
        !history.some(
          (event) =>
            event.day === day &&
            event.reason === 'review' &&
            event.target === note,
        ),
    );
  if (review.length)
    return {
      target: review[0],
      reason: 'review',
      detail: 'A little review to start today',
    };

  const unseen = notes.find(
    (note) => !history.some((event) => event.target === note),
  );
  // Separate new ideas with a familiar success, rather than showing all new
  // notes in succession. The initial anchors follow the same gentle rule.
  if (
    unseen !== undefined &&
    (previous === null || history.at(-1)?.reason !== 'introduce')
  )
    return { target: unseen, reason: 'introduce', detail: 'Meet a new note' };
  const choices = notes.filter(
    (note) =>
      note !== previous && history.some((event) => event.target === note),
  );
  if (!choices.length)
    return {
      target: unseen ?? notes[0],
      reason: 'introduce',
      detail: 'Meet a new note',
    };
  // Weighted sampling favours uncertain notes, but familiar ones always retain
  // a share. No immediate repeats and no speed threshold.
  const weights = choices.map(
    (note) => 1 + 2 * (1 - noteEvidence(history, note).accuracy),
  );
  let ticket =
    Math.max(0, Math.min(0.999999, random())) *
    weights.reduce((a, b) => a + b, 0);
  const index = weights.findIndex((weight) => {
    ticket -= weight;
    return ticket < 0;
  });
  return {
    target: choices[Math.max(0, index)],
    reason: 'practice',
    detail: 'A mix of familiar and growing notes',
  };
}

// Start only after notation is rendered. Hidden/blurred time is excluded;
// interrupted rounds retain their evidence but have no comparable latency.
export class ResponseTimer {
  private elapsed = 0;
  private since: number | null = null;
  private interrupted = false;
  private ready = false;
  constructor(private clock: LearningClock) {}
  start() {
    this.ready = true;
    this.resume();
  }
  pause() {
    if (!this.ready) return;
    this.interrupted = true;
    if (this.since !== null)
      this.elapsed += Math.max(0, this.clock.monotonic() - this.since);
    this.since = null;
  }
  resume() {
    if (this.ready && this.since === null) this.since = this.clock.monotonic();
  }
  read() {
    return !this.ready || this.interrupted
      ? null
      : this.elapsed +
          (this.since === null
            ? 0
            : Math.max(0, this.clock.monotonic() - this.since));
  }
}
