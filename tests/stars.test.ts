import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assessLesson,
  bestStars,
  journeyProgress,
  lessonById,
  lessonOpen,
  lessons,
} from '../src/curriculum';
import { withEncounter } from '../src/learners';
import { finishLesson, lessonEvents, newLearner } from './fixtures/journey';

test('stars distinguish completion at 60% hearts, no mistakes, and optional fluency', () => {
  const lesson = lessonById('find-five')!;
  const events = lessonEvents(newLearner(), lesson.id);
  const assess = (history = events) =>
    assessLesson(lesson, history, events[0].lesson!.runId).stars;
  assert.equal(assess(events.slice(0, -1)), 0);
  assert.equal(assess(), 3);
  assert.equal(
    assess(events.map((event) => ({ ...event, fluentResponseMs: 4000 }))),
    3,
  );
  assert.equal(
    assess(events.map((event) => ({ ...event, fluentResponseMs: 4001 }))),
    2,
  );
  assert.equal(
    assess(events.map((event) => ({ ...event, fluentResponseMs: null }))),
    2,
  );
  const passing = events.map((event, index) =>
    index < 6
      ? event
      : { ...event, guesses: [61, 63, 66, event.target], reward: 0 },
  );
  assert.equal(assess(passing), 1); // 18 of 30 hearts, exactly 60%.
  const awarded = passing.reduce(withEncounter, newLearner());
  assert.equal(bestStars(awarded, lesson.id), 1);
  assert.equal(journeyProgress(awarded).gems, 1);
  passing[0] = { ...passing[0], guesses: [61, passing[0].target], reward: 2 };
  assert.equal(assess(passing), 0);
  assert.equal(
    journeyProgress(passing.reduce(withEncounter, newLearner())).gems,
    0,
  );
  for (const pattern of lessons.filter((item) => item.patterns)) {
    const sequence = lessonEvents(newLearner(), pattern.id);
    assert.equal(
      assessLesson(pattern, sequence, sequence[0].lesson!.runId).stars,
      3,
    );
    sequence[1] = { ...sequence[1], fluentResponseMs: 2001 };
    assert.equal(
      assessLesson(pattern, sequence, sequence[0].lesson!.runId).stars,
      2,
    );
  }
});

test('personal bests never decrease and legacy merged exercises retain rewards without another first-star payout', () => {
  let state = finishLesson(newLearner(), 'read-three');
  delete state.learner.lessonStars; // A save from before star ratings existed.
  const oldGems = journeyProgress(state).gems;
  assert.equal(bestStars(state, 'find-three'), 2);
  const priorBadges = state.learner.badges;
  state = finishLesson(state, 'find-three');
  assert.equal(journeyProgress(state).gems, oldGems + 1);
  assert.deepEqual(state.learner.badges, priorBadges);
  assert.equal(bestStars(state, 'find-three'), 3);
  state = finishLesson(state, 'find-three', (event) => ({
    ...event,
    guesses: [61, 62, 63, event.target],
    reward: 0,
  }));
  assert.equal(bestStars(state, 'find-three'), 3);
  assert.equal(bestStars(newLearner('other'), 'find-three'), 0);
  const final = lessonEvents(state, 'find-five');
  const completed = final.reduce(withEncounter, state);
  assert.equal(withEncounter(completed, final.at(-1)!), completed);
  assert.equal(
    completed.learner.lessonStars!.filter(
      (entry) => entry.lessonId === 'find-five',
    ).length,
    1,
  );
});

test('the active catalog keeps names, replaces duplicate reading/Quick lessons and adds musical variations', () => {
  assert.ok(lessons.every((lesson) => lesson.support === 'names'));
  for (const id of [
    'read-three',
    'read-five',
    'read-octave',
    'fluent-octave',
  ]) {
    assert.ok(lessonById(id, 1));
    assert.equal(lessonOpen(newLearner(), lessonById(id)!), false);
  }
  for (const id of [
    'five-up',
    'five-down',
    'scale-up',
    'scale-down',
    'repeats',
    'neighbours',
    'mixed-steps',
    'broken-chords',
    'moving-fifths',
  ])
    assert.ok(lessons.some((lesson) => lesson.id === id));
  assert.deepEqual(
    lessonById('scale-up')!.patterns![0],
    [60, 62, 64, 65, 67, 69, 71, 72],
  );
  assert.deepEqual(
    lessonById('scale-down')!.patterns![0],
    [72, 71, 69, 67, 65, 64, 62, 60],
  );
});
