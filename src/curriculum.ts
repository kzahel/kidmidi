import type { LearnerSnapshot } from './learners';
import type { Encounter } from './learning';
import {
  type Lesson,
  legacyLessons,
  lessons,
  mergedLessonId,
  type World,
  worlds,
} from './lesson-catalog';

export {
  type Lesson,
  type LessonBadge,
  type LessonRunReward,
  legacyLessons,
  lessons,
  type World,
  worlds,
} from './lesson-catalog';

export function lessonById(id: string, revision?: number) {
  return [...lessons, ...legacyLessons].find(
    (lesson) =>
      lesson.id === id &&
      (revision === undefined || lesson.revision === revision),
  );
}
export function hasBadge(snapshot: LearnerSnapshot, id: string) {
  return (
    snapshot.learner.badges?.some(
      (badge) => mergedLessonId(badge.lessonId) === mergedLessonId(id),
    ) ?? false
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
export type StarCount = 0 | 1 | 2 | 3;
export type LessonStars = {
  lessonId: string;
  stars: StarCount;
  revision: number;
  runId: string;
  at: number;
};
export function fluencyMs(lesson: Lesson, index: number) {
  return lesson.patterns && index % patternSize(lesson) !== 0 ? 2000 : 4000;
}
export function bestStars(snapshot: LearnerSnapshot, id: string): StarCount {
  const same = (other: string) => mergedLessonId(other) === mergedLessonId(id);
  return Math.max(
    0,
    ...(snapshot.learner.lessonStars ?? [])
      .filter((entry) => same(entry.lessonId))
      .map((entry) => entry.stars),
    ...(snapshot.learner.badges ?? [])
      .filter((entry) => same(entry.lessonId))
      .map(() => 1),
    ...(snapshot.learner.runRewards ?? [])
      .filter((entry) => same(entry.lessonId))
      .map(() => 2),
  ) as StarCount;
}
export function nextStarGoal(lesson: Lesson, stars: number) {
  return stars === 0
    ? 'Finish with 60% hearts'
    : stars === 1
      ? 'No mistakes'
      : stars === 2
        ? `Fluent: ${lesson.patterns ? '4s / 2s' : '4s'} finds`
        : 'All three stars earned';
}
export function journeyProgress(snapshot: LearnerSnapshot) {
  const badges = snapshot.learner.badges ?? [];
  const gems =
    badges.reduce((sum, badge) => sum + badge.gems, 0) +
    (snapshot.learner.runRewards ?? []).reduce(
      (sum, reward) => sum + reward.gems,
      0,
    );
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
    stars: lessons.reduce(
      (sum, lesson) => sum + bestStars(snapshot, lesson.id),
      0,
    ),
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
  const mistakeFree =
    complete && rounds.every((event) => event.guesses.length === 1);
  const fluent =
    mistakeFree &&
    rounds.every((event) => {
      const ms =
        event.fluentResponseMs === undefined
          ? event.firstResponseMs
          : event.fluentResponseMs;
      return ms !== null && ms <= fluencyMs(lesson, event.lesson!.index);
    });
  const hearts = rounds.reduce((total, event) => total + event.reward, 0);
  const stars: StarCount = !complete
    ? 0
    : fluent
      ? 3
      : mistakeFree
        ? 2
        : hearts >= length * 3 * lesson.heartMultiplier * 0.6
          ? 1
          : 0;
  return {
    complete,
    mistakeFree,
    stars,
    successes: successes.length,
    length,
    // Version-one badge policy is retained for exact historical definitions.
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
