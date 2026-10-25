import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assessLesson,
  hasBadge,
  journeyProgress,
  lessonById,
  lessonDeck,
  lessonLength,
  lessonOpen,
  lessons,
  patternSize,
  worldOpen,
  worlds,
} from '../src/curriculum';
import { progress, withEncounter, withPurchase } from '../src/learners';
import {
  advanceCurriculum,
  chooseExercise,
  noteEvidence,
} from '../src/learning';
import {
  finishLesson,
  gardenGraduate,
  lessonEvents,
  newLearner,
} from './fixtures/journey';

test('catalog has unique stable IDs, valid gates and balanced decks with no adjacent repeats', () => {
  assert.equal(
    new Set(lessons.map((lesson) => lesson.id)).size,
    lessons.length,
  );
  assert.equal(new Set(worlds.map((world) => world.id)).size, worlds.length);
  assert.equal(worlds.filter((world) => world.entry).length, 1);
  for (const lesson of lessons) {
    assert.ok(Number.isInteger(lesson.revision) && lesson.revision > 0);
    assert.ok(lesson.notes.length > 1);
    assert.equal(new Set(lesson.notes).size, lesson.notes.length);
    assert.ok(
      lesson.assessment.accuracy > 0 && lesson.assessment.accuracy <= 1,
    );
    assert.ok(
      lesson.assessment.successesPerNote > 0 &&
        lesson.assessment.successesPerNote <= lesson.assessment.repetitions,
    );
    if (lesson.patterns) {
      const size = patternSize(lesson);
      assert.ok(size > 1);
      assert.ok(lesson.patterns.every((pattern) => pattern.length === size));
      assert.deepEqual(
        [...new Set(lesson.patterns.flat())].sort(),
        [...lesson.notes].sort(),
      );
    }
    const visited = new Set([lesson.id]);
    let prerequisite = lesson.requires;
    while (prerequisite) {
      assert.ok(
        !visited.has(prerequisite),
        'Lesson prerequisites must not form a cycle',
      );
      visited.add(prerequisite);
      const previous = lessonById(prerequisite);
      assert.ok(previous, 'Each prerequisite must exist');
      prerequisite = previous.requires;
    }
    assert.ok(worlds.some((world) => world.id === lesson.world));
    if (lesson.requires) assert.ok(lessonById(lesson.requires));
    for (const value of [0, 0.5, 0.999999]) {
      const deck = lessonDeck(lesson, () => value);
      assert.equal(deck.length, lessonLength(lesson));
      for (const note of lesson.notes)
        assert.equal(
          deck.filter((target) => target === note).length,
          (lesson.patterns?.flat() ?? lesson.notes).filter(
            (target) => target === note,
          ).length * lesson.assessment.repetitions,
        );
      assert.ok(
        lesson.patterns ||
          deck.every(
            (target, index) => index === 0 || target !== deck[index - 1],
          ),
      );
    }
  }
  for (const world of worlds)
    if (world.gate) assert.ok(lessonById(world.gate.badge));
});

test('all implemented lessons can be chosen immediately without spending or earlier badges', () => {
  let state = newLearner();
  const legacy = lessonEvents(state, 'find-three')[0];
  delete legacy.lesson;
  for (let i = 0; i < 100; i++)
    state = withEncounter(state, { ...legacy, id: `easy-${i}` });
  assert.equal(progress(state).earned, 300);
  assert.equal(journeyProgress(state).world, 1);
  assert.equal(journeyProgress(state).gemBalance, 0);
  assert.throws(
    () => withPurchase(state, 'gate-treehouse', 'gate', 0),
    /badge/,
  );
  for (const lesson of lessons) assert.equal(lessonOpen(state, lesson), true);
  const advanced = finishLesson(newLearner(), 'read-octave');
  assert.equal(hasBadge(advanced, 'read-octave'), true);
  assert.equal(hasBadge(advanced, 'read-three'), false);
  assert.equal(advanced.purchases.length, 0);
  assert.equal(
    lessonOpen(state, { ...lessons[0], id: 'unimplemented' }),
    false,
  );
  assert.throws(() => withPurchase(state, 'gate-cave', 'future', 0), /Unknown/);
  state = ['find-three', 'find-five', 'find-octave'].reduce(
    (state, id) => finishLesson(state, id),
    state,
  );
  const before = progress(state).balance;
  state = withPurchase(state, 'gate-treehouse', 'gate', 0);
  assert.equal(progress(state).balance, before - 60);
  assert.equal(journeyProgress(state).world, 2);
  assert.equal(withPurchase(state, 'gate-treehouse', 'retry', 1), state);
  assert.equal(lessonOpen(state, lessonById('find-three')!), true);
  assert.equal(lessonOpen(state, lessonById('read-three')!), true);
  assert.equal(lessonOpen(state, lessonById('read-five')!), true);
});

test('one balanced run earns a permanent badge and gems once; repeats still earn hearts', () => {
  let state = newLearner();
  const events = lessonEvents(state, 'find-three');
  for (const event of events.slice(0, -1)) state = withEncounter(state, event);
  assert.equal(hasBadge(state, 'find-three'), false);
  const last = events.at(-1)!;
  state = withEncounter(state, last);
  assert.equal(journeyProgress(state).gems, 1);
  assert.equal(withEncounter(state, last), state);
  assert.throws(
    () => withEncounter(state, { ...last, id: 'duplicate-card' }),
    /already/,
  );
  state = finishLesson(state, 'find-three');
  assert.equal(journeyProgress(state).gems, 1);
  assert.equal(progress(state).earned, 36);
  assert.equal(lessonOpen(state, lessonById('find-five')!), true);
  assert.equal(hasBadge(state, 'find-three'), true);
  assert.equal(
    assessLesson(
      { ...lessonById('find-three')!, revision: 2 },
      events,
      events[0].lesson!.runId,
    ).earned,
    false,
  );
  assert.equal(state.learner.badges![0].revision, 1);
});

test('badges require a full run, 80 percent success and every pitch; runs cannot be combined', () => {
  const lesson = lessonById('find-octave')!;
  const events = lessonEvents(newLearner(), lesson.id);
  const runId = events[0].lesson!.runId;
  assert.equal(assessLesson(lesson, events.slice(0, -1), runId).earned, false);
  const miss = (index: number) => ({
    ...events[index],
    guesses: [61, events[index].target],
    reward: 2,
  });
  const oneMiss = [...events];
  oneMiss[0] = miss(0);
  assert.equal(assessLesson(lesson, oneMiss, runId).earned, true);
  const missedPitch = events.map((event) =>
    event.target === 60 ? { ...event, guesses: [61, 60], reward: 2 } : event,
  );
  assert.equal(assessLesson(lesson, missedPitch, runId).earned, false);
  const tooMany = events.map((event, index) =>
    index < 4 ? miss(index) : event,
  );
  assert.equal(assessLesson(lesson, tooMany, runId).earned, false);
  const mixed = events.map((event, index) =>
    index === 0
      ? { ...event, lesson: { ...event.lesson!, runId: 'other' } }
      : event,
  );
  assert.equal(assessLesson(lesson, mixed, runId).earned, false);
  assert.equal(
    assessLesson(lesson, [...events.slice(0, -1), events[0]], runId).earned,
    false,
  );
});

test('reading help and slow/interrupted fluency keep heart rewards but do not earn a badge', () => {
  const garden = gardenGraduate();
  let state = withPurchase(garden, 'gate-treehouse', 'gate', 0);
  state = finishLesson(state, 'read-three', (event) => ({
    ...event,
    assistance: 'note-name',
  }));
  assert.equal(hasBadge(state, 'read-three'), false);
  assert.equal(progress(state).earned - progress(garden).earned, 36);
  state = finishLesson(state, 'read-three', (event) => ({
    ...event,
    firstResponseMs: 60000,
    durationMs: 60000,
  }));
  assert.equal(hasBadge(state, 'read-three'), true); // Ordinary lessons never test speed.
  state = finishLesson(state, 'read-five');
  state = finishLesson(state, 'read-octave');
  const before = progress(state).earned;
  for (const latency of [60000, null]) {
    state = finishLesson(state, 'fluent-octave', (event) => ({
      ...event,
      firstResponseMs: latency,
      durationMs: latency,
    }));
    assert.equal(hasBadge(state, 'fluent-octave'), false);
  }
  assert.equal(progress(state).earned - before, 16 * 9 * 2);
  state = finishLesson(state, 'fluent-octave', (event) => ({
    ...event,
    firstResponseMs: 4000,
    durationMs: 4000,
  }));
  assert.equal(hasBadge(state, 'fluent-octave'), true);
});

test('gem purchases use their own wallet and cannot remove badges or close a world', () => {
  let state = gardenGraduate();
  const hearts = progress(state).balance;
  state = withPurchase(state, 'dog', 'puppy', 0);
  assert.equal(state.learner.pet, 'dog');
  assert.equal(progress(state).balance, hearts);
  assert.equal(journeyProgress(state).gemBalance, 0);
  assert.equal(journeyProgress(state).badges, 3);
  state = withPurchase(state, 'gate-treehouse', 'gate', 0);
  assert.equal(worldOpen(state, worlds[1]), true);
  assert.equal(progress(state).balance, 36);
  assert.equal(withPurchase(state, 'dog', 'retry', 0), state);
  const poor = newLearner();
  assert.throws(() => withPurchase(poor, 'dog', 'puppy', 0), /gems/);
  assert.equal(journeyProgress(poor).badges, 0);
});

test('reward metadata rejects unknown/revised lessons, invalid indices and inflated rewards', () => {
  const state = newLearner();
  const event = lessonEvents(state, 'find-three')[0];
  for (const lesson of [
    { ...event.lesson!, id: 'unknown' },
    { ...event.lesson!, revision: 2 },
    { ...event.lesson!, index: 6 },
    { ...event.lesson!, index: 0.5 },
  ])
    assert.throws(() => withEncounter(state, { ...event, lesson }), /invalid/);
  assert.throws(() => withEncounter(state, { ...event, reward: 9 }), /invalid/);
  assert.throws(() => withEncounter(newLearner('sibling'), event), /mismatch/);
});

test('pattern decks preserve complete shapes; badges require every phrase and survive replay', () => {
  for (const lesson of lessons.filter((item) => item.patterns)) {
    const state = newLearner();
    const events = lessonEvents(state, lesson.id);
    const size = patternSize(lesson);
    assert.equal(events.length, lessonLength(lesson));
    for (let i = 0; i < events.length; i += size)
      assert.ok(
        lesson.patterns!.some(
          (pattern) =>
            pattern.join(',') ===
            events
              .slice(i, i + size)
              .map((event) => event.target)
              .join(','),
        ),
      );
    const run = events[0].lesson!.runId;
    assert.equal(assessLesson(lesson, events.slice(0, -1), run).earned, false);
    assert.equal(assessLesson(lesson, events, run).earned, true);
    const reordered = events.map((event, index) => ({
      ...event,
      target: events[(index + 1) % events.length].target,
    }));
    assert.equal(assessLesson(lesson, reordered, run).earned, false);
    const completed = events.reduce(withEncounter, state);
    assert.equal(hasBadge(completed, lesson.id), true);
    assert.equal(journeyProgress(completed).gems, 1);
    assert.equal(journeyProgress(finishLesson(completed, lesson.id)).gems, 1);
  }
});

test('pattern following does not enter the independent-note adaptive path', () => {
  let state = newLearner();
  for (let day = 1; day <= 4; day++) {
    for (const id of ['steps-up', 'skips', 'returns'])
      state = finishLesson(state, id, (event) => ({
        ...event,
        day: `2026-10-0${day}`,
      }));
  }
  assert.equal(noteEvidence(state.encounters, 60).seen, 0);
  assert.equal(advanceCurriculum(3, state.encounters), 3);
  assert.deepEqual(chooseExercise(state.encounters, 3, '2026-10-25'), {
    target: 60,
    reason: 'introduce',
    detail: 'Meet a new note',
  });
});
