import assert from 'node:assert/strict';
import test from 'node:test';
import { journeyProgress, lessons } from '../src/curriculum';
import {
  progress,
  rewards,
  withEquipment,
  withPurchase,
} from '../src/learners';
import { finishLesson, newLearner } from './fixtures/journey';

const graduate = () =>
  lessons.reduce(
    (state, lesson) => finishLesson(state, lesson.id),
    newLearner(),
  );

test('every shop reward is attainable, spends only its own wallet and remains owned after taking it off', () => {
  const funded = graduate();
  assert.equal(new Set(rewards.map((item) => item.id)).size, rewards.length);
  for (const item of rewards) {
    assert.ok(Number.isInteger(item.cost) && item.cost > 0);
    assert.throws(
      () => withPurchase(newLearner(), item.id, 'poor', 0),
      new RegExp(item.currency),
    );
    const bought = withPurchase(funded, item.id, item.id, 1);
    assert.equal(bought.learner[item.slot], item.id);
    assert.equal(
      progress(bought).balance,
      progress(funded).balance - (item.currency === 'hearts' ? item.cost : 0),
    );
    assert.equal(
      journeyProgress(bought).gemBalance,
      journeyProgress(funded).gemBalance -
        (item.currency === 'gems' ? item.cost : 0),
    );
    assert.deepEqual(bought.learner.badges, funded.learner.badges);
    const removed = withEquipment(
      bought,
      item.slot,
      item.slot === 'pet' ? 'fox' : null,
    );
    assert.equal(
      withEquipment(removed, item.slot, item.id).learner[item.slot],
      item.id,
    );
    assert.equal(withPurchase(removed, item.id, 'retry', 2), removed);
    assert.throws(
      () => withEquipment(newLearner(), item.slot, item.id),
      /Collect/,
    );
  }
});
