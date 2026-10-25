import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import test from 'node:test';
import { journeyProgress } from '../src/curriculum';
import { IndexedDbLearners } from '../src/learner-repository';
import { type LearnerSnapshot, progress } from '../src/learners';
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
  assert.equal(journeyProgress(state).gems, 3);
  assert.equal(state.encounters.length, 32);
  await Promise.all([
    first.buy('journey', 'dog', 'puppy-one', 0),
    other.buy('journey', 'dog', 'puppy-two', 0),
  ]);
  assert.equal(journeyProgress(await other.load('journey')).gemBalance, 0);
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
  assert.equal(journeyProgress(state).gems, 3);
  assert.equal(state.learner.badges?.length, 3);
  assert.equal(
    state.purchases.filter((purchase) => purchase.itemId === 'dog').length,
    1,
  );
});
