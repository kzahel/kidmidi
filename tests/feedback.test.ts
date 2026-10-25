import assert from 'node:assert/strict';
import test from 'node:test';
import {
  type FeedbackClock,
  IdleHint,
  NoteFeedback,
  type NoteHit,
} from '../src/feedback';
import { startPosition } from '../src/music';

class Clock implements FeedbackClock {
  time = 0;
  private serial = 0;
  private timers = new Map<number, { at: number; callback: () => void }>();
  now() {
    return this.time;
  }
  schedule(callback: () => void, delayMs: number) {
    const id = ++this.serial;
    this.timers.set(id, { at: this.time + delayMs, callback });
    return id;
  }
  cancel(timer: number) {
    this.timers.delete(timer);
  }
  tick(ms: number) {
    const end = this.time + ms;
    for (;;) {
      const next = [...this.timers.entries()]
        .filter(([, timer]) => timer.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      this.time = next[1].at;
      this.timers.delete(next[0]);
      next[1].callback();
    }
    this.time = end;
  }
}

function fixture() {
  const clock = new Clock();
  let shown: NoteHit | null = null;
  const feedback = new NoteFeedback((hit) => {
    shown = hit;
  }, clock);
  return { clock, feedback, shown: () => shown };
}

test('a tap stays visible for its written duration; a held note stays until release', () => {
  for (const beats of [0.5, 1, 2] as const) {
    const { clock, feedback, shown } = fixture();
    feedback.start(startPosition(), { midi: 60, beats }, 'piano-C');
    feedback.release('piano-C');
    clock.tick(beats * 480 - 1);
    assert.equal(shown()?.midi, 60);
    clock.tick(1);
    assert.equal(shown(), null);
  }
  const { clock, feedback, shown } = fixture();
  feedback.start(startPosition(), { midi: 60, beats: 1 }, 'piano-C');
  clock.tick(2500);
  assert.equal(shown()?.released, false);
  feedback.release('other-input');
  assert.equal(shown()?.released, false);
  feedback.release('piano-C');
  clock.tick(99);
  assert.equal(shown()?.released, true);
  clock.tick(1);
  assert.equal(shown(), null);
});

test('early next attacks replace feedback immediately and old releases/timers cannot clear them', () => {
  const { clock, feedback, shown } = fixture();
  feedback.start(startPosition(), { midi: 60, beats: 1 }, 'piano-C');
  feedback.release('piano-C');
  clock.tick(100);
  const nextPosition = { phrase: 1, note: 0, complete: false };
  feedback.start(nextPosition, { midi: 67, beats: 1 }, 'piano-G');
  assert.deepEqual(shown()?.position, nextPosition);
  assert.equal(shown()?.midi, 67);
  feedback.release('piano-C');
  clock.tick(1000);
  assert.equal(shown()?.midi, 67);
  feedback.release('piano-G');
  clock.tick(100);
  assert.equal(shown(), null);
});

test('reset cancels feedback; dispose cancels pending work without a late callback', () => {
  const { clock, feedback, shown } = fixture();
  feedback.start(startPosition(), { midi: 60, beats: 2 }, 'piano-C');
  feedback.release('piano-C');
  feedback.cancel();
  assert.equal(shown(), null);
  clock.tick(2000);
  assert.equal(shown(), null);
  feedback.start(startPosition(), { midi: 62, beats: 1 }, 'piano-D');
  feedback.release('piano-D');
  const last = shown();
  feedback.dispose();
  clock.tick(2000);
  assert.equal(shown(), last);
});

test('idle hints wait for a full pause and stay hidden while feedback or keys block them', () => {
  const clock = new Clock();
  let visible = false;
  const hint = new IdleHint((value) => {
    visible = value;
  }, clock);
  hint.update(false);
  clock.tick(1799);
  assert.equal(visible, false);
  clock.tick(1);
  assert.equal(visible, true);
  hint.update(true);
  assert.equal(visible, false);
  clock.tick(10000);
  assert.equal(visible, false);
  hint.update(false);
  clock.tick(1000);
  hint.update(true);
  hint.update(false);
  clock.tick(1799);
  assert.equal(visible, false);
  clock.tick(1);
  assert.equal(visible, true);
});

test('disposing an idle hint prevents a stale timer from displaying it', () => {
  const clock = new Clock();
  let visible = false;
  const hint = new IdleHint((value) => {
    visible = value;
  }, clock);
  hint.update(false);
  hint.dispose();
  clock.tick(5000);
  assert.equal(visible, false);
});
