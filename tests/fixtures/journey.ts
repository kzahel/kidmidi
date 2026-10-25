import { lessonById, lessonDeck } from '../../src/curriculum';
import { type LearnerSnapshot, withEncounter } from '../../src/learners';
import type { Encounter } from '../../src/learning';

export function newLearner(id = 'child'): LearnerSnapshot {
  return {
    learner: {
      id,
      name: 'Piano friend',
      createdAt: 0,
      timeZone: 'UTC',
      unlocked: 3,
      pet: 'fox',
      charm: null,
    },
    encounters: [],
    purchases: [],
  };
}
let serial = 0;
export function lessonEvents(
  snapshot: LearnerSnapshot,
  id: string,
  change: (event: Encounter, index: number) => Encounter = (event) => event,
) {
  const lesson = lessonById(id)!;
  const runId = `run-${++serial}`;
  return lessonDeck(lesson, () => 0.5).map(
    (target, index): Encounter =>
      change(
        {
          id: `${runId}-${index}`,
          learnerId: snapshot.learner.id,
          startedAt: serial * 100 + index,
          day: '2026-10-25',
          target,
          spelling: String(target),
          guesses: [target],
          firstResponseMs: 1000,
          durationMs: 1000,
          assistance: lesson.support === 'names' ? 'note-name' : 'none',
          input: 'midi',
          reason: 'chosen',
          reward: 3 * lesson.heartMultiplier,
          lesson: { id, revision: lesson.revision, runId, index },
        },
        index,
      ),
  );
}
export function finishLesson(
  snapshot: LearnerSnapshot,
  id: string,
  change?: (event: Encounter, index: number) => Encounter,
) {
  return lessonEvents(snapshot, id, change).reduce(withEncounter, snapshot);
}
export function gardenGraduate() {
  return ['find-three', 'find-five', 'find-octave'].reduce(
    (state, id) => finishLesson(state, id),
    newLearner(),
  );
}
