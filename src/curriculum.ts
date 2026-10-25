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
// Legacy purchased-world milestones remain readable; they no longer gate lessons.
export function worldOpen(snapshot: LearnerSnapshot, world: World) {
  return (
    world.entry === true ||
    snapshot.purchases.some(
      (purchase) => purchase.itemId === `gate-${world.id}`,
    )
  );
}
// Badges suggest an order; implemented lessons can always be tried directly.
export function lessonOpen(_snapshot: LearnerSnapshot, lesson: Lesson) {
  return lessons.some((item) => item.id === lesson.id);
}
export function lessonLength(lesson: Lesson) {
  return (
    (lesson.patterns?.flat().length ?? lesson.notes.length) *
    lesson.assessment.repetitions
  );
}
export function patternSize(lesson: Lesson) {
  return lesson.patterns?.[0]?.length ?? 1;
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

// Shuffle each pass independently, keeping every pattern intact. Single-note
// decks visit every pitch twice and avoid adjacent repeats.
export function lessonDeck(lesson: Lesson, random: () => number = Math.random) {
  const deck: number[] = [];
  for (let pass = 0; pass < lesson.assessment.repetitions; pass++) {
    const notes = lesson.patterns
      ? [...lesson.patterns]
      : lesson.notes.map((note) => [note]);
    for (let i = notes.length - 1; i > 0; i--) {
      const j = Math.max(0, Math.min(i, Math.floor(random() * (i + 1))));
      [notes[i], notes[j]] = [notes[j], notes[i]];
    }
    if (!lesson.patterns && notes[0][0] === deck.at(-1))
      notes.push(notes.shift()!);
    deck.push(...notes.flat());
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
  const length = lessonLength(lesson);
  const expected = lessonDeck(lesson, () => 0);
  const ordered = [...rounds].sort((a, b) => a.lesson!.index - b.lesson!.index);
  const size = patternSize(lesson);
  const phrases = Array.from({ length: length / size }, (_, index) =>
    ordered
      .slice(index * size, (index + 1) * size)
      .map((event) => event.target)
      .join(','),
  );
  const complete =
    rounds.length === length &&
    new Set(rounds.map((event) => event.lesson!.index)).size === length &&
    rounds.every(
      (event) => event.lesson!.index >= 0 && event.lesson!.index < length,
    ) &&
    (!lesson.patterns ||
      lesson.patterns.every(
        (pattern) =>
          phrases.filter((phrase) => phrase === pattern.join(',')).length ===
          lesson.assessment.repetitions,
      )) &&
    lesson.notes.every(
      (note) =>
        rounds.filter((event) => event.target === note).length ===
        expected.filter((target) => target === note).length,
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
