import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import test from 'node:test';
import { bestStars, journeyProgress } from '../src/curriculum';
import { IndexedDbLearners } from '../src/learner-repository';
import { type LearnerSnapshot, progress, wearing } from '../src/learners';
import type { Encounter } from '../src/learning';
import { lessonEvents, newLearner } from './fixtures/journey';

test('IndexedDB persists selection and isolates learners; concurrent rewards and purchases are atomic', async () => {
  const repository = new IndexedDbLearners();
  for (const id of ['one', 'two'])
    await repository.create({
      id,
      name: id,
      createdAt: 0,
      timeZone: 'UTC',
      unlocked: 3,
      pet: 'fox',
      charm: null,
    });
  await repository.select('one');
  const events: Encounter[] = Array.from({ length: 8 }, (_, i) => ({
    id: `event-${i}`,
    learnerId: 'one',
    target: 60,
    startedAt: i,
    day: '2026-10-25',
    spelling: 'C4',
    guesses: [60],
    firstResponseMs: 1000,
    durationMs: 1000,
    assistance: 'note-name',
    input: 'midi',
    reason: 'practice',
    reward: 3,
  }));
  await Promise.all(events.map((event) => repository.record(event)));
  await repository.record(events[0]);
  const reloaded = new IndexedDbLearners();
  assert.equal(await reloaded.selected(), 'one');
  assert.equal(progress(await reloaded.load('one')).earned, 24);
  assert.equal(progress(await reloaded.load('two')).earned, 0);
  const bought = await Promise.allSettled([
    repository.buy('one', 'cat', 'cat-purchase', 0),
    reloaded.buy('one', 'bow', 'bow-purchase', 0),
  ]);
  assert.equal(
    bought.filter((result) => result.status === 'fulfilled').length,
    1,
  );
  assert.ok(progress(await reloaded.load('one')).balance >= 0);
  assert.equal((await reloaded.load('one')).purchases.length, 1);
  await repository.rename('one', '  Ada  ');
  assert.equal((await reloaded.load('one')).learner.name, 'Ada');
  await assert.rejects(repository.rename('one', '  '));
  await assert.rejects(repository.select('missing'));
  assert.equal(await reloaded.selected(), 'one');
});

test('badges, gem awards and world purchases are atomic across retries and tabs', async () => {
  const first = new IndexedDbLearners();
  const other = new IndexedDbLearners();
  await first.create(newLearner('journey-sibling').learner);
  let state: LearnerSnapshot = await first.create(
    newLearner('journey').learner,
  );
  for (const id of ['find-three', 'find-five', 'find-octave']) {
    const events = lessonEvents(state, id);
    for (const event of events.slice(0, -1)) state = await first.record(event);
    await Promise.all([
      first.record(events.at(-1)!),
      other.record(events.at(-1)!),
    ]);
    state = await other.load('journey');
  }
  assert.equal(journeyProgress(state).gems, 6);
  assert.equal(state.learner.runRewards!.length, 3);
  assert.equal(state.encounters.length, 32);
  await Promise.all([
    first.buy('journey', 'dog', 'puppy-one', 0),
    other.buy('journey', 'dog', 'puppy-two', 0),
  ]);
  assert.equal(journeyProgress(await other.load('journey')).gemBalance, 3);
  const spending = await Promise.allSettled([
    first.buy('journey', 'gate-treehouse', 'gate', 0),
    other.buy('journey', 'rabbit', 'rabbit', 0),
    first.buy('journey', 'cat', 'cat', 0),
  ]);
  assert.equal(
    spending.filter((result) => result.status === 'rejected').length,
    1,
  );
  state = await other.load('journey');
  assert.ok(progress(state).balance >= 0);
  assert.equal(journeyProgress(state).gems, 6);
  assert.equal(state.learner.badges?.length, 3);
  assert.equal(
    state.purchases.filter((purchase) => purchase.itemId === 'dog').length,
    1,
  );
  const replay = lessonEvents(state, 'find-three');
  await Promise.all(replay.map((event) => first.record(event)));
  await Promise.all([
    first.record(replay.at(-1)!),
    other.record(replay.at(-1)!),
  ]);
  state = await new IndexedDbLearners().load('journey');
  assert.equal(journeyProgress(state).gems, 7);
  assert.equal(state.learner.badges!.length, 3);
  assert.equal(state.learner.runRewards!.length, 4);
  assert.equal(journeyProgress(await other.load('journey-sibling')).gems, 0);
});

test('concurrent compatible purchases and individual removals retain the rest of the saved outfit', async () => {
  const first = new IndexedDbLearners();
  const other = new IndexedDbLearners();
  const learner = newLearner('outfit-concurrency').learner;
  await first.create(learner);
  for (let index = 0; index < 32; index++)
    await first.record({
      id: `outfit-fund-${index}`,
      learnerId: learner.id,
      target: 60,
      startedAt: index,
      day: '2026-10-25',
      spelling: 'C4',
      guesses: [60],
      firstResponseMs: 1000,
      durationMs: 1000,
      assistance: 'note-name',
      input: 'midi',
      reason: 'practice',
      reward: 3,
    });
  await Promise.all([
    first.buy(learner.id, 'bow', 'outfit-bow', 0),
    other.buy(learner.id, 'sunglasses', 'outfit-shades', 0),
    first.buy(learner.id, 'star', 'outfit-star', 0),
  ]);
  let state = await new IndexedDbLearners().load(learner.id);
  assert.deepEqual(wearing(state.learner), ['star', 'sunglasses', 'bow']);
  assert.equal(progress(state).balance, 24);
  await Promise.all([
    other.equip(learner.id, 'charm', 'sunglasses', true),
    first.equip(learner.id, 'pet', 'fox'),
  ]);
  state = await new IndexedDbLearners().load(learner.id);
  assert.deepEqual(wearing(state.learner), ['star', 'bow']);
  assert.equal(state.purchases.length, 3);
  assert.equal(progress(state).balance, 24);
});

test('competing exercise completions persist the higher stars and award each run only once', async () => {
  const first = new IndexedDbLearners();
  const other = new IndexedDbLearners();
  const state = await first.create(newLearner('star-concurrency').learner);
  const slow = lessonEvents(state, 'find-three', (event) => ({
    ...event,
    firstResponseMs: 60000,
  }));
  const fast = lessonEvents(state, 'find-three');
  await Promise.all([
    ...slow.map((event) => first.record(event)),
    ...fast.map((event) => other.record(event)),
  ]);
  await first.record(slow.at(-1)!);
  await other.record(fast.at(-1)!);
  const saved = await new IndexedDbLearners().load('star-concurrency');
  assert.equal(bestStars(saved, 'find-three'), 3);
  assert.equal(
    saved.learner.lessonStars!.filter(
      (entry) => entry.lessonId === 'find-three',
    ).length,
    1,
  );
  assert.equal(saved.learner.runRewards!.length, 2);
  assert.equal(journeyProgress(saved).gems, 3);
});
