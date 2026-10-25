import type { LearnerSnapshot } from './learners';
import type { Encounter } from './learning';
import { type Lesson, lessons, type World, worlds } from './lesson-catalog';

export {
  type Lesson,
  type LessonBadge,
  lessons,
  type World,
  worlds,
} from './lesson-catalog';

export function lessonById(id: string) {
  return lessons.find((lesson) => lesson.id === id);
}
export function hasBadge(snapshot: LearnerSnapshot, id: string) {
  return (
    snapshot.learner.badges?.some((badge) => badge.lessonId === id) ?? false
  );
}
export function worldOpen(snapshot: LearnerSnapshot, world: World) {
  return (
    world.entry === true ||
    snapshot.purchases.some(
      (purchase) => purchase.itemId === `gate-${world.id}`,
    )
  );
}
export function lessonOpen(snapshot: LearnerSnapshot, lesson: Lesson) {
  const world = worlds.find((world) => world.id === lesson.world);
  return Boolean(
    world &&
      worldOpen(snapshot, world) &&
      (!lesson.requires || hasBadge(snapshot, lesson.requires)),
  );
}
export function journeyProgress(snapshot: LearnerSnapshot) {
  const badges = snapshot.learner.badges ?? [];
  const gems = badges.reduce((sum, badge) => sum + badge.gems, 0);
  const spent = snapshot.purchases
    .filter((purchase) => purchase.currency === 'gems')
    .reduce((sum, purchase) => sum + purchase.cost, 0);
  return {
    world: Math.max(
      1,
      ...worlds.map((world, index) =>
        worldOpen(snapshot, world) ? index + 1 : 0,
      ),
    ),
    badges: badges.length,
    gems,
    gemBalance: gems - spent,
  };
}

// A balanced deck visits every pitch twice. Shuffle each pass independently;
// avoid an immediate repeat where passes meet.
export function lessonDeck(lesson: Lesson, random: () => number = Math.random) {
  const deck: number[] = [];
  for (let pass = 0; pass < lesson.assessment.repetitions; pass++) {
    const notes = [...lesson.notes];
    for (let i = notes.length - 1; i > 0; i--) {
      const j = Math.max(0, Math.min(i, Math.floor(random() * (i + 1))));
      [notes[i], notes[j]] = [notes[j], notes[i]];
    }
    if (notes[0] === deck.at(-1)) notes.push(notes.shift()!);
    deck.push(...notes);
  }
  return deck;
}

export function assessLesson(
  lesson: Lesson,
  history: Encounter[],
  runId: string,
) {
  const rounds = history.filter(
    (event) =>
      event.lesson?.id === lesson.id &&
      event.lesson.revision === lesson.revision &&
      event.lesson.runId === runId,
  );
  const length = lesson.notes.length * lesson.assessment.repetitions;
  const complete =
    rounds.length === length &&
    new Set(rounds.map((event) => event.lesson!.index)).size === length &&
    rounds.every(
      (event) => event.lesson!.index >= 0 && event.lesson!.index < length,
    ) &&
    lesson.notes.every(
      (note) =>
        rounds.filter((event) => event.target === note).length ===
        lesson.assessment.repetitions,
    );
  const successes = rounds.filter(
    (event) =>
      event.guesses.length === 1 &&
      (lesson.support === 'names' || event.assistance === 'none') &&
      (lesson.assessment.fluentMs === undefined ||
        (event.firstResponseMs !== null &&
          event.firstResponseMs <= lesson.assessment.fluentMs)),
  );
  return {
    complete,
    successes: successes.length,
    length,
    earned:
      complete &&
      successes.length / length >= lesson.assessment.accuracy &&
      lesson.notes.every(
        (note) =>
          successes.filter((event) => event.target === note).length >=
          lesson.assessment.successesPerNote,
      ),
  };
}
