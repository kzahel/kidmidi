import assert from 'node:assert/strict';
import test from 'node:test';
import { guessHunt, huntLevels, nextHunt, startHunt } from '../src/hunt';

test('note hunt rewards accurate finds without penalizing later success or counting a match twice', () => {
  for (const [misses, reward] of [
    [0, 3],
    [1, 2],
    [2, 1],
    [3, 0],
    [8, 0],
  ]) {
    let state = startHunt();
    // Correct letter in the wrong octave is still a miss.
    for (let i = 0; i < misses; i++) state = guessHunt(state, 72);
    const found = guessHunt(state, 60);
    assert.equal(found.attempts, misses + 1);
    assert.equal(found.reward, reward);
    assert.equal(found.points, reward);
    assert.equal(found.solved, 1);
    assert.equal(found.found, true);
    assert.equal(guessHunt(found, 60), found);
    assert.equal(guessHunt(found, 64), found);
  }
});

test('note hunt introduces C and E, keeps scores across cards and stays inside the selected white-note range', () => {
  for (const level of Object.keys(huntLevels) as (keyof typeof huntLevels)[]) {
    let state = startHunt(level);
    assert.equal(nextHunt(state), state);
    const sequence: number[] = [];
    for (let i = 0; i < 24; i++) {
      sequence.push(state.target);
      const previous = state.target;
      const found = guessHunt(state, state.target);
      state = nextHunt(found, () => (i % 10) / 10);
      assert.equal(state.points, (i + 1) * 3);
      assert.equal(state.solved, i + 1);
      assert.equal(state.played, null);
      assert.equal(state.attempts, 0);
      assert.equal(state.found, false);
      assert.notEqual(state.target, previous);
      assert.ok(
        (huntLevels[level].notes as readonly number[]).includes(state.target),
      );
    }
    assert.deepEqual(sequence.slice(0, 4), [60, 64, 60, 67]);
  }
});
