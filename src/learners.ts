import {
  assessLesson,
  hasBadge,
  journeyProgress,
  type LessonBadge,
  lessonById,
  lessonLength,
  lessonOpen,
  worldOpen,
  worlds,
} from './curriculum';
import { advanceCurriculum, type Encounter } from './learning';

export const rewards = [
  {
    id: 'cat',
    name: 'Cat friend',
    icon: '🐱',
    description: 'A curious little listener.',
    cost: 18,
    currency: 'hearts',
    slot: 'pet',
  },
  {
    id: 'rabbit',
    name: 'Bunny friend',
    icon: '🐰',
    description: 'Big ears for little melodies.',
    cost: 30,
    currency: 'hearts',
    slot: 'pet',
  },
  {
    id: 'bow',
    name: 'Party bow',
    icon: '🎀',
    description: 'A bright bow for your friend.',
    cost: 12,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'star',
    name: 'Star charm',
    icon: '🌟',
    description: 'Wear a little bit of starlight.',
    cost: 24,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'dog',
    name: 'Puppy friend',
    icon: '🐶',
    description: 'A cheerful companion for every tune.',
    cost: 3,
    currency: 'gems',
    slot: 'pet',
  },
  {
    id: 'scarf',
    name: 'Cosy scarf',
    icon: '🧣',
    description: 'A soft teal scarf for piano days.',
    cost: 18,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'flower',
    name: 'Daisy crown',
    icon: '🌼',
    description: 'A flower picked just for your friend.',
    cost: 24,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'crown',
    name: 'Golden crown',
    icon: '👑',
    description: 'Every little musician can be royalty.',
    cost: 48,
    currency: 'hearts',
    slot: 'charm',
  },
] as const;
export type Learner = {
  id: string;
  name: string;
  createdAt: number;
  timeZone: string;
  unlocked: number;
  pet: string;
  charm: string | null;
  badges?: LessonBadge[];
};
export type Purchase = {
  id: string;
  learnerId: string;
  itemId: string;
  cost: number;
  at: number;
  currency?: 'hearts' | 'gems';
};
export type LearnerSnapshot = {
  learner: Learner;
  encounters: Encounter[];
  purchases: Purchase[];
};

export function progress(snapshot: LearnerSnapshot) {
  const earned = snapshot.encounters.reduce(
    (sum, event) => sum + event.reward,
    0,
  );
  const spent = snapshot.purchases.reduce(
    (sum, purchase) => sum + (purchase.currency === 'gems' ? 0 : purchase.cost),
    0,
  );
  return {
    earned,
    balance: earned - spent,
  };
}

export interface LearnerRepository {
  list(): Promise<Learner[]>;
  selected(): Promise<string | null>;
  select(id: string): Promise<void>;
  create(learner: Learner): Promise<LearnerSnapshot>;
  load(id: string): Promise<LearnerSnapshot>;
  rename(id: string, name: string): Promise<void>;
  record(event: Encounter): Promise<LearnerSnapshot>;
  buy(
    learnerId: string,
    itemId: string,
    purchaseId: string,
    at: number,
  ): Promise<LearnerSnapshot>;
  equip(
    learnerId: string,
    slot: 'pet' | 'charm',
    itemId: string | null,
  ): Promise<LearnerSnapshot>;
}

export function learnerName(name: string) {
  const value = name.trim().slice(0, 40);
  if (!value) throw new Error('Please give your learner a name.');
  return value;
}

export function validateEncounter(event: Encounter) {
  const lesson = event.lesson ? lessonById(event.lesson.id) : undefined;
  if (
    !event.id ||
    !event.learnerId ||
    !Number.isInteger(event.target) ||
    event.target < 0 ||
    event.target > 127 ||
    !event.guesses.length ||
    event.guesses.at(-1) !== event.target ||
    event.guesses.slice(0, -1).includes(event.target) ||
    event.guesses.some(
      (note) => !Number.isInteger(note) || note < 0 || note > 127,
    ) ||
    event.reward !==
      Math.max(0, 4 - event.guesses.length) * (lesson?.heartMultiplier ?? 1) ||
    !['note-name', 'none'].includes(event.assistance) ||
    (event.lesson &&
      (!lesson ||
        event.lesson.revision !== lesson.revision ||
        !event.lesson.runId ||
        !Number.isInteger(event.lesson.index) ||
        event.lesson.index < 0 ||
        event.lesson.index >= lessonLength(lesson) ||
        !lesson.notes.includes(event.target) ||
        (lesson.support === 'names' && event.assistance !== 'note-name'))) ||
    !Number.isFinite(event.startedAt) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(event.day) ||
    [event.firstResponseMs, event.durationMs].some(
      (ms) => ms !== null && (!Number.isFinite(ms) || ms < 0),
    )
  )
    throw new Error('This learning encounter is invalid.');
}

export function withEncounter(
  snapshot: LearnerSnapshot,
  event: Encounter,
): LearnerSnapshot {
  validateEncounter(event);
  if (snapshot.learner.id !== event.learnerId)
    throw new Error('Learner mismatch.');
  if (snapshot.encounters.some((old) => old.id === event.id)) return snapshot;
  const lesson = event.lesson ? lessonById(event.lesson.id)! : undefined;
  if (lesson && !lessonOpen(snapshot, lesson))
    throw new Error('Open this lesson on the map first.');
  if (
    event.lesson &&
    snapshot.encounters.some(
      (old) =>
        old.lesson?.runId === event.lesson!.runId &&
        (old.lesson.id !== event.lesson!.id ||
          old.lesson.revision !== event.lesson!.revision ||
          old.lesson.index === event.lesson!.index),
    )
  )
    throw new Error('This lesson card has already been saved.');
  const encounters = [...snapshot.encounters, event].sort(
    (a, b) => a.startedAt - b.startedAt || a.id.localeCompare(b.id),
  );
  const badges = snapshot.learner.badges ?? [];
  const award =
    lesson &&
    !hasBadge(snapshot, lesson.id) &&
    assessLesson(lesson, encounters, event.lesson!.runId).earned;
  return {
    ...snapshot,
    encounters,
    learner: {
      ...snapshot.learner,
      unlocked: advanceCurriculum(snapshot.learner.unlocked, encounters),
      ...(award
        ? {
            badges: [
              ...badges,
              {
                lessonId: lesson.id,
                revision: lesson.revision,
                runId: event.lesson!.runId,
                at: event.startedAt,
                gems: lesson.gems,
              },
            ],
          }
        : {}),
    },
  };
}

export function withPurchase(
  snapshot: LearnerSnapshot,
  itemId: string,
  id: string,
  at: number,
): LearnerSnapshot {
  const world = worlds.find(
    (world) => `gate-${world.id}` === itemId && world.gate,
  );
  if (world?.gate) {
    if (worldOpen(snapshot, world)) return snapshot;
    if (snapshot.purchases.some((purchase) => purchase.id === id))
      throw new Error('Purchase ID already used.');
    if (!hasBadge(snapshot, world.gate.badge))
      throw new Error('Collect the required lesson badge first.');
    if (progress(snapshot).balance < world.gate.hearts)
      throw new Error('Keep collecting hearts for this gate.');
    return {
      ...snapshot,
      purchases: [
        ...snapshot.purchases,
        {
          id,
          learnerId: snapshot.learner.id,
          itemId,
          cost: world.gate.hearts,
          currency: 'hearts',
          at,
        },
      ],
    };
  }
  const item = rewards.find((candidate) => candidate.id === itemId);
  if (!item) throw new Error('Unknown reward.');
  if (
    snapshot.purchases.some(
      (purchase) => purchase.id === id || purchase.itemId === itemId,
    )
  )
    return snapshot;
  if (
    (item.currency === 'gems'
      ? journeyProgress(snapshot).gemBalance
      : progress(snapshot).balance) < item.cost
  )
    throw new Error(`Keep collecting ${item.currency} for this reward.`);
  return {
    ...snapshot,
    learner: { ...snapshot.learner, [item.slot]: item.id },
    purchases: [
      ...snapshot.purchases,
      {
        id,
        learnerId: snapshot.learner.id,
        itemId,
        cost: item.cost,
        currency: item.currency,
        at,
      },
    ],
  };
}

export function withEquipment(
  snapshot: LearnerSnapshot,
  slot: 'pet' | 'charm',
  itemId: string | null,
): LearnerSnapshot {
  const free =
    (slot === 'pet' && itemId === 'fox') ||
    (slot === 'charm' && itemId === null);
  if (
    !free &&
    !rewards.some(
      (item) =>
        item.id === itemId &&
        item.slot === slot &&
        snapshot.purchases.some((purchase) => purchase.itemId === item.id),
    )
  )
    throw new Error('Collect this reward before using it.');
  return { ...snapshot, learner: { ...snapshot.learner, [slot]: itemId } };
}
