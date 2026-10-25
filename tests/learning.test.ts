import assert from 'node:assert/strict';
import test from 'node:test';
import { journeyProgress } from '../src/curriculum';
import {
  type LearnerSnapshot,
  progress,
  withEncounter,
  withEquipment,
  withPurchase,
} from '../src/learners';
import {
  advanceCurriculum,
  chooseExercise,
  curriculum,
  type Encounter,
  learningDay,
  noteEvidence,
  ResponseTimer,
} from '../src/learning';

export function emptyLearner(id = 'child'): LearnerSnapshot {
  return {
    learner: {
      id,
      name: 'Piano friend',
      createdAt: 0,
      timeZone: 'Europe/Berlin',
      unlocked: 3,
      pet: 'fox',
      charm: null,
    },
    encounters: [],
    purchases: [],
  };
}
let serial = 0;
export function encounter(
  target = 60,
  day = '2026-10-25',
  guesses = [target],
): Encounter {
  const index = ++serial;
  return {
    id: `round-${index}`,
    learnerId: 'child',
    startedAt: Date.parse(`${day}T12:00:00Z`) + index,
    day,
    target,
    spelling: `${target}`,
    guesses,
    firstResponseMs: 1500,
    durationMs: 1500,
    assistance: 'note-name',
    input: 'midi',
    reason: 'practice',
    reward: Math.max(0, 4 - guesses.length),
  };
}

test('calendar days use the learner timezone across midnight and daylight saving', () => {
  assert.equal(
    learningDay(Date.parse('2026-10-24T22:30:00Z'), 'Europe/Berlin'),
    '2026-10-25',
  );
  assert.equal(
    learningDay(Date.parse('2026-10-25T23:30:00Z'), 'Europe/Berlin'),
    '2026-10-26',
  );
  assert.equal(
    learningDay(Date.parse('2026-10-25T23:30:00Z'), 'America/New_York'),
    '2026-10-25',
  );
});

test('response timing starts at render and interrupted responses have no comparable latency', () => {
  let mono = 100;
  let wall = 0;
  const timer = new ResponseTimer({ now: () => wall, monotonic: () => mono });
  assert.equal(timer.read(), null);
  timer.start();
  wall = -99999;
  mono += 700;
  assert.equal(timer.read(), 700);
  timer.pause();
  mono += 60000;
  timer.resume();
  mono += 200;
  assert.equal(timer.read(), null);
});

test('one excellent day cannot advance; six successes per note across three days can', () => {
  const oneDay = curriculum
    .slice(0, 3)
    .flatMap((note) => Array.from({ length: 12 }, () => encounter(note)));
  assert.equal(advanceCurriculum(3, oneDay), 3);
  const multiDay = ['2026-10-23', '2026-10-24', '2026-10-25'].flatMap((day) =>
    curriculum
      .slice(0, 3)
      .flatMap((note) => [encounter(note, day), encounter(note, day)]),
  );
  assert.equal(advanceCurriculum(3, multiDay), 4);
  assert.equal(advanceCurriculum(4, multiDay), 4);
  assert.equal(noteEvidence(multiDay, 60).ready, true);
  assert.equal(
    noteEvidence(
      [
        ...multiDay,
        ...Array.from({ length: 6 }, () =>
          encounter(60, '2026-10-26', [61, 60]),
        ),
      ],
      60,
    ).ready,
    false,
  );
});

test('daily review resumes after restart and a week away without losing unlocked notes', () => {
  const earlier = [60, 64, 67].map((note) => encounter(note));
  let history = earlier;
  for (const target of [60, 64, 67]) {
    const choice = chooseExercise(history, 3, '2026-11-01');
    assert.equal(choice.reason, 'review');
    assert.equal(choice.target, target);
    history = [
      ...history,
      { ...encounter(target, '2026-11-01'), reason: 'review' },
    ];
  }
  assert.equal(chooseExercise(history, 3, '2026-11-01').reason, 'practice');
  assert.equal(chooseExercise(history, 4, '2026-11-01').target, 62);
  assert.equal(chooseExercise(history, 4, '2026-11-01').reason, 'introduce');
});

test('weighted practice provides familiar successes without starvation or immediate repeats', () => {
  const history = [
    encounter(60),
    encounter(64, '2026-10-25', [61, 64]),
    encounter(67),
  ];
  const counts = new Map<number, number>();
  for (let index = 0; index < 100; index++) {
    const choice = chooseExercise(
      history,
      3,
      '2026-10-25',
      null,
      () => (index + 0.5) / 100,
    );
    counts.set(choice.target, (counts.get(choice.target) ?? 0) + 1);
    assert.notEqual(
      chooseExercise(history, 3, '2026-10-25', choice.target, () => index / 100)
        .target,
      choice.target,
    );
  }
  assert.equal(counts.size, 3);
  assert.ok(counts.get(64)! > counts.get(60)!);
});

test('rewards are idempotent, spendable and separate from permanent level and curriculum', () => {
  let state = emptyLearner();
  const event = encounter();
  state = withEncounter(state, event);
  assert.deepEqual(withEncounter(state, event), state);
  assert.throws(() =>
    withEncounter(state, { ...event, id: 'bad', reward: 99 }),
  );
  assert.throws(() => withEquipment(state, 'charm', 'bow'));
  assert.throws(() => withPurchase(state, 'bow', 'buy', 0));
  for (let i = 0; i < 3; i++) state = withEncounter(state, encounter());
  assert.equal(journeyProgress(state).world, 1);
  state = withPurchase(state, 'bow', 'buy', 0);
  assert.equal(state.learner.charm, 'bow');
  assert.equal(progress(state).balance, 0);
  assert.equal(progress(state).earned, 12);
  assert.equal(journeyProgress(state).world, 1);
  assert.equal(withPurchase(state, 'bow', 'retry', 0), state);
  state = withEquipment(state, 'charm', 'bow');
  assert.equal(state.learner.charm, 'bow');
  assert.equal(state.learner.unlocked, 3);
  assert.throws(() => withEncounter(emptyLearner('sibling'), event));
});

test('a deterministic multi-day journey gradually adds notes and retains progression after difficulty', () => {
  let state = emptyLearner();
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let day = 1; day <= 20; day++) {
    let previous: number | null = null;
    for (let round = 0; round < 24; round++) {
      const date = `2026-10-${String(day).padStart(2, '0')}`;
      const choice = chooseExercise(
        state.encounters,
        state.learner.unlocked,
        date,
        previous,
        random,
      );
      state = withEncounter(state, {
        ...encounter(choice.target, date),
        reason: choice.reason,
      });
      previous = choice.target;
    }
  }
  assert.equal(state.learner.unlocked, 8);
  const level = journeyProgress(state).world;
  for (let i = 0; i < 15; i++)
    state = withEncounter(state, encounter(72, '2026-10-21', [61, 62, 63, 72]));
  assert.equal(state.learner.unlocked, 8);
  assert.equal(journeyProgress(state).world, level);
});
