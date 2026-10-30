import assert from 'node:assert/strict';
import test from 'node:test';
import { ghostAccidental, ghostPitch, staffStep } from '../src/played-note';

test('played pitch follows staff steps, including semitones, across octaves', () => {
  assert.equal(staffStep(64) - staffStep(60), 2);
  assert.equal(staffStep(65) - staffStep(64), 1);
  assert.equal(staffStep(61), staffStep(60));
  assert.equal(staffStep(72) - staffStep(60), 7);
  assert.deepEqual(ghostPitch(64, 60, 100, 10, 20, 180), {
    displayed: 64,
    y: 90,
  });
  assert.deepEqual(ghostPitch(59, 60, 100, 10, 20, 180), {
    displayed: 59,
    y: 105,
  });
  assert.deepEqual(ghostPitch(65, 66, 100, 10, 20, 180), {
    displayed: 65,
    y: 100,
  });
});

test('extreme played pitches use explicitly labelled octave displacement without changing pitch class', () => {
  for (let midi = 0; midi <= 127; midi++) {
    const ghost = ghostPitch(midi, 60, 100, 10, 35, 115);
    assert.ok(ghost.y >= 35 && ghost.y <= 115);
    assert.equal(Math.abs(ghost.displayed - midi) % 12, 0);
  }
  assert.equal(ghostPitch(64, 60, 100, 10, 35, 115).displayed, 64);
});

test('ghost accidentals disambiguate black keys and naturals against the song key signature', () => {
  assert.equal(ghostAccidental(61, 0), '♯');
  assert.equal(ghostAccidental(66, 2), '♯');
  assert.equal(ghostAccidental(65, 2), '♮');
  assert.equal(ghostAccidental(60, 2), '♮');
  assert.equal(ghostAccidental(69, 2), '');
  assert.equal(ghostAccidental(71, -1), '♮');
  assert.equal(ghostAccidental(65, 0), '');
});
