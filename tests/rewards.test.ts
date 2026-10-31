import assert from 'node:assert/strict';
import test from 'node:test';
import { journeyProgress, lessons } from '../src/curriculum';
import {
  previewAccessory,
  progress,
  rewards,
  wearing,
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

test('compatible accessories layer, same-position choices replace only that piece, and removal never changes ownership', () => {
  let state = graduate();
  for (const id of [
    'crown',
    'sunglasses',
    'earrings',
    'scarf',
    'star',
    'raincoat',
    'satchel',
    'cape',
  ])
    state = withPurchase(state, id, id, 0);
  assert.deepEqual(wearing(state.learner), [
    'cape',
    'raincoat',
    'scarf',
    'star',
    'satchel',
    'earrings',
    'sunglasses',
    'crown',
  ]);
  const original = state;
  const preview = previewAccessory(state.learner, 'flower');
  assert.ok(wearing(preview).includes('flower'));
  assert.ok(!wearing(preview).includes('crown'));
  assert.ok(wearing(original.learner).includes('crown'));
  assert.equal(preview.accessories?.length, 8);
  state = withPurchase(state, 'flower', 'flower', 0);
  assert.equal(wearing(state.learner).length, 8);
  assert.ok(wearing(state.learner).includes('sunglasses'));
  assert.ok(!wearing(state.learner).includes('crown'));
  const before = state;
  state = withEquipment(state, 'charm', 'sunglasses', true);
  assert.equal(wearing(state.learner).length, 7);
  assert.ok(!wearing(state.learner).includes('sunglasses'));
  assert.deepEqual(state.purchases, before.purchases);
  assert.deepEqual(progress(state), progress(before));
  state = withEquipment(state, 'pet', 'fox');
  assert.equal(wearing(state.learner).length, 7);
  state = withEquipment(state, 'charm', 'sunglasses');
  assert.equal(wearing(state.learner).length, 8);
  const empty = withEquipment(state, 'charm', null);
  assert.deepEqual(wearing(empty.learner), []);
  assert.equal(empty.learner.charm, null);
  assert.deepEqual(empty.purchases, state.purchases);
  assert.throws(
    () => withEquipment(newLearner(), 'charm', 'crown', true),
    /Collect/,
  );
});

test('legacy charm saves keep their piece when another accessory is equipped, with explicit empty outfits taking precedence', () => {
  let state = withPurchase(graduate(), 'bow', 'bow', 0);
  delete state.learner.accessories;
  assert.deepEqual(wearing(state.learner), ['bow']);
  state = withPurchase(state, 'sunglasses', 'shades', 0);
  assert.deepEqual(wearing(state.learner), ['sunglasses', 'bow']);
  assert.equal(state.learner.charm, 'sunglasses');
  assert.deepEqual(wearing({ charm: 'bow', accessories: [] }), []);
  assert.deepEqual(
    wearing({
      charm: 'bow',
      accessories: ['unknown', 'dog', 'bow', 'flower', 'flower', 'sunglasses'],
    }),
    ['sunglasses', 'flower'],
  );
  for (const item of rewards.filter((reward) => reward.slot === 'charm'))
    assert.ok(item.wear);
});

test('Halloween pieces use earned hearts, layer with existing outfits and stay owned after a costume change', () => {
  const halloween = rewards.filter(
    (item) => 'theme' in item && item.theme === 'halloween',
  );
  assert.equal(halloween.length, 6);
  const funded = withPurchase(
    withPurchase(graduate(), 'sunglasses', 'shades', 0),
    'bow-tie',
    'tie',
    0,
  );
  const dressed = halloween.reduce((state, item) => {
    assert.equal(item.currency, 'hearts');
    assert.equal(item.slot, 'charm');
    return withPurchase(state, item.id, item.id, 0);
  }, funded);
  assert.equal(
    progress(dressed).balance,
    progress(funded).balance -
      halloween.reduce((total, item) => total + item.cost, 0),
  );
  assert.equal(
    journeyProgress(dressed).gemBalance,
    journeyProgress(funded).gemBalance,
  );
  assert.deepEqual(wearing(dressed.learner), [
    'vampire-cape',
    'pumpkin-suit',
    'bow-tie',
    'ghost-charm',
    'pumpkin-pail',
    'sunglasses',
    'witch-hat',
  ]);
  const bat = withEquipment(dressed, 'charm', 'bat-wings');
  assert.deepEqual(
    wearing(bat.learner),
    wearing(dressed.learner).map((id) =>
      id === 'vampire-cape' ? 'bat-wings' : id,
    ),
  );
  assert.deepEqual(bat.purchases, dressed.purchases);
  const removed = withEquipment(bat, 'charm', 'witch-hat', true);
  assert.ok(!wearing(removed.learner).includes('witch-hat'));
  assert.deepEqual(withPurchase(removed, 'witch-hat', 'retry', 0), removed);
  assert.ok(
    wearing(withEquipment(removed, 'charm', 'witch-hat').learner).includes(
      'witch-hat',
    ),
  );
});

test('backdrops are permanent learner purchases independent of friends, outfits and wallets', () => {
  const dressed = withPurchase(graduate(), 'bow', 'bow-scene', 0);
  const bought = withPurchase(dressed, 'treehouse-scene', 'treehouse', 1);
  assert.equal(bought.learner.backdrop, 'treehouse-scene');
  assert.equal(bought.learner.pet, dressed.learner.pet);
  assert.deepEqual(wearing(bought.learner), wearing(dressed.learner));
  const cleared = withEquipment(bought, 'backdrop', null);
  assert.equal(cleared.learner.backdrop, null);
  assert.deepEqual(cleared.purchases, bought.purchases);
  assert.deepEqual(progress(cleared), progress(bought));
  const moon = withPurchase(cleared, 'moon-scene', 'moon', 2);
  assert.equal(moon.learner.backdrop, 'moon-scene');
  assert.deepEqual(progress(moon), progress(cleared));
  const restored = withEquipment(moon, 'backdrop', 'treehouse-scene');
  assert.equal(restored.learner.backdrop, 'treehouse-scene');
  assert.deepEqual(restored.purchases, moon.purchases);
  assert.throws(() => withEquipment(restored, 'backdrop', 'bow'), /Collect/);
  assert.throws(
    () => withEquipment(newLearner('sibling'), 'backdrop', 'moon-scene'),
    /Collect/,
  );
});
