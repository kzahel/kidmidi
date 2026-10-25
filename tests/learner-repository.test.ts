import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import test from 'node:test';
import { IndexedDbLearners } from '../src/learner-repository';
import { progress } from '../src/learners';
import type { Encounter } from '../src/learning';

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
