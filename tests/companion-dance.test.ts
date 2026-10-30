import assert from 'node:assert/strict';
import test from 'node:test';
import { CompanionDance, type Dance } from '../src/companion-dance';
import type { FeedbackClock } from '../src/feedback';

function fixture() {
  let time = 0;
  let serial = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  const clock: FeedbackClock = {
    now: () => time,
    schedule: (callback, delay) => {
      const id = ++serial;
      timers.set(id, { at: time + delay, callback });
      return id;
    },
    cancel: (id) => {
      timers.delete(id);
    },
  };
  let dance: Dance | null = null;
  const dancer = new CompanionDance((next) => {
    dance = next;
  }, clock);
  function tick(ms: number) {
    time += ms;
    for (const [id, timer] of timers) {
      if (timer.at <= time) {
        timers.delete(id);
        timer.callback();
      }
    }
  }
  function play(notes: number[], gap = 250) {
    for (const pitch of notes) {
      tick(gap);
      dancer.noteOn(pitch);
    }
  }
  return { dancer, tick, play, shown: () => dance, timers };
}

test('major and natural minor scales flip in both directions, any key/octave and an unhurried pace', () => {
  for (const root of [24, 48, 60, 63, 84]) {
    for (const shape of [
      [0, 2, 4, 5, 7, 9, 11, 12],
      [0, 2, 3, 5, 7, 8, 10, 12],
    ]) {
      for (const reverse of [false, true]) {
        const f = fixture();
        const notes = shape.map((interval) => root + interval);
        f.play(reverse ? notes.reverse() : notes, 4000);
        assert.equal(f.shown()?.move, reverse ? 'backflip' : 'flip');
        assert.equal(f.timers.size, 1);
      }
    }
  }
});

test('repeats, alternating notes, octaves, arpeggios and chromatic walks reveal different tricks', () => {
  for (const [notes, move] of [
    [[60, 60, 60, 60], 'echo'],
    [[60, 64, 60, 64, 60], 'twirl'],
    [[60, 72], 'leap'],
    [[72, 60], 'leap'],
    [[60, 64, 67, 72], 'spin'],
    [[60, 63, 67, 72], 'spin'],
    [[72, 67, 64, 60], 'spin'],
    [[72, 67, 63, 60], 'spin'],
    [[60, 61, 62, 63, 64, 65], 'tiptoe'],
    [[65, 64, 63, 62, 61, 60], 'tiptoe'],
  ] as const) {
    const f = fixture();
    f.play([...notes]);
    assert.equal(f.shown()?.move, move);
  }
  const fastRepeats = fixture();
  fastRepeats.play([60, 60, 60, 60], 50);
  assert.equal(fastRepeats.shown()?.move, 'echo');
});

test('ordinary notes restart the hop and follow the contour; chords, interruptions and unrelated notes do not make a scale', () => {
  const f = fixture();
  f.play([60, 62, 64]);
  assert.equal(f.shown()?.move, 'hop');
  assert.equal(f.shown()?.direction, 1);
  assert.equal(f.shown()?.lift, 2);
  const step = f.shown()!.id;
  f.play([60]);
  assert.ok(f.shown()!.id > step);
  assert.equal(f.shown()?.direction, -1);
  assert.equal(f.shown()?.lift, 0);
  f.dancer.reset();
  f.play([60, 64, 67, 72], 20);
  assert.equal(
    f.shown()?.move,
    'hop',
    'a rolled chord is not an arpeggio discovery',
  );
  f.dancer.reset();
  f.play([60, 62, 64, 65]);
  f.tick(11000);
  f.play([67, 69, 71, 72]);
  assert.equal(f.shown()?.move, 'hop');
  f.dancer.reset();
  f.play([60, 62, 64, 66, 67, 69, 71, 72]);
  assert.equal(f.shown()?.move, 'hop');
});

test('tricks finish while more notes arrive, expire independently of releases, and dispose cancels pending work', () => {
  const f = fixture();
  f.play([60, 62, 64, 65, 67, 69, 71, 72]);
  const trick = f.shown();
  f.play([63, 68]);
  assert.equal(f.shown(), trick);
  f.tick(899);
  assert.equal(f.shown(), trick);
  f.tick(1);
  assert.equal(f.shown(), null);
  f.play([70]);
  f.tick(550);
  assert.equal(f.shown(), null);
  f.play([60, 62, 64]);
  f.dancer.reset();
  assert.equal(f.shown(), null);
  assert.equal(f.timers.size, 0);
  f.play([65, 67, 69, 71, 72]);
  assert.equal(f.shown()?.move, 'hop', 'reset discards a partial scale');
  f.dancer.dispose();
  assert.equal(f.timers.size, 0);
});

test('MIDI event timestamps preserve a melodic phrase delivered in a batch', () => {
  const f = fixture();
  for (const [index, pitch] of [60, 62, 64, 65, 67, 69, 71, 72].entries())
    f.dancer.noteOn(pitch, index * 200);
  assert.equal(f.shown()?.move, 'flip');
  f.tick(1400);
  assert.equal(f.shown(), null, 'presentation uses its own clock');
});
