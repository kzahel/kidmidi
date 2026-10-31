import {
  assessLesson,
  bestStars,
  hasBadge,
  journeyProgress,
  type LessonBadge,
  type LessonRunReward,
  type LessonStars,
  lessonById,
  lessonLength,
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
    wear: 'head',
    name: 'Party bow',
    icon: '🎀',
    description: 'A bright bow for your friend.',
    cost: 12,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'star',
    wear: 'charm',
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
    wear: 'neck',
    name: 'Cosy scarf',
    icon: '🧣',
    description: 'A soft teal scarf for piano days.',
    cost: 18,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'flower',
    wear: 'head',
    name: 'Daisy crown',
    icon: '🌼',
    description: 'A flower picked just for your friend.',
    cost: 24,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'crown',
    wear: 'head',
    name: 'Golden crown',
    icon: '👑',
    description: 'Every little musician can be royalty.',
    cost: 48,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'bird',
    name: 'Bird friend',
    icon: '🐦',
    description: 'A sky-blue pal with a song in its heart.',
    cost: 42,
    currency: 'hearts',
    slot: 'pet',
  },
  {
    id: 'frog',
    name: 'Frog friend',
    icon: '🐸',
    description: 'A pond-side pal who loves a little jam.',
    cost: 60,
    currency: 'hearts',
    slot: 'pet',
  },
  {
    id: 'panda',
    name: 'Panda friend',
    icon: '🐼',
    description: 'A gentle bamboo buddy for big hugs.',
    cost: 96,
    currency: 'hearts',
    slot: 'pet',
  },
  {
    id: 'dragon',
    name: 'Little dragon',
    icon: '🐉',
    description: 'A lavender dragon with a heart for music.',
    cost: 8,
    currency: 'gems',
    slot: 'pet',
  },
  {
    id: 'sunglasses',
    wear: 'eyes',
    name: 'Sunny shades',
    icon: '🕶️',
    description: 'Cool blue glasses for sunny-day tunes.',
    cost: 36,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'earrings',
    wear: 'ears',
    name: 'Cherry earrings',
    icon: '🍒',
    description: 'A tiny pair of cherries for each cheek.',
    cost: 40,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'bucket-hat',
    wear: 'head',
    name: 'Puddle hat',
    icon: '👒',
    description: 'A yellow hat for rainy-day adventures.',
    cost: 54,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'bow-tie',
    wear: 'neck',
    name: 'Rainbow bow tie',
    icon: '🌈',
    description: 'Dress up for your very own piano concert.',
    cost: 64,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'headphones',
    wear: 'ears',
    name: 'Jam headphones',
    icon: '🎧',
    description: 'Big purple ear cups, just for pretend.',
    cost: 80,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'raincoat',
    wear: 'body',
    name: 'Rainy-day coat',
    icon: '🧥',
    description: 'A little yellow coat with room for a song.',
    cost: 100,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'satchel',
    wear: 'bag',
    name: 'Adventure bag',
    icon: '🎒',
    description: 'A tiny satchel for imaginary treasures.',
    cost: 120,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'wizard-hat',
    wear: 'head',
    name: 'Wizard hat',
    icon: '🧙',
    description: 'Every melody can be a little spell.',
    cost: 160,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'moon',
    wear: 'charm',
    name: 'Moon pendant',
    icon: '🌙',
    description: 'Carry a crescent from the bedtime sky.',
    cost: 2,
    currency: 'gems',
    slot: 'charm',
  },
  {
    id: 'cape',
    wear: 'back',
    name: 'Starlight cape',
    icon: '✨',
    description: 'A midnight-blue cape dotted with stars.',
    cost: 4,
    currency: 'gems',
    slot: 'charm',
  },
  {
    id: 'wings',
    wear: 'back',
    name: 'Butterfly wings',
    icon: '🦋',
    description: 'A pair of rosy wings for musical daydreams.',
    cost: 5,
    currency: 'gems',
    slot: 'charm',
  },
  {
    id: 'crystal-crown',
    wear: 'head',
    name: 'Crystal crown',
    icon: '💎',
    description: 'An icy-blue crown for a grand piano parade.',
    cost: 6,
    currency: 'gems',
    slot: 'charm',
  },
  {
    id: 'witch-hat',
    wear: 'head',
    theme: 'halloween',
    name: 'Witch hat',
    icon: '🧙',
    description: 'A crooked purple hat for a spooky little spell.',
    cost: 36,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'bat-wings',
    wear: 'back',
    theme: 'halloween',
    name: 'Bat wings',
    icon: '🦇',
    description: 'Spread your wings for a moonlit melody.',
    cost: 60,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'pumpkin-suit',
    wear: 'body',
    theme: 'halloween',
    name: 'Pumpkin suit',
    icon: '🎃',
    description: 'A round orange costume with a jack-o’-lantern grin.',
    cost: 48,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'ghost-charm',
    wear: 'charm',
    theme: 'halloween',
    name: 'Ghost charm',
    icon: '👻',
    description: 'A tiny smiling ghost. Boo to you too!',
    cost: 18,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'pumpkin-pail',
    wear: 'bag',
    theme: 'halloween',
    name: 'Pumpkin pail',
    icon: '🍬',
    description: 'A little pumpkin bucket for pretend trick-or-treating.',
    cost: 30,
    currency: 'hearts',
    slot: 'charm',
  },
  {
    id: 'vampire-cape',
    wear: 'back',
    theme: 'halloween',
    name: 'Vampire cape',
    icon: '🧛',
    description: 'A dramatic plum cape for your midnight concert.',
    cost: 72,
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
  accessories?: string[];
  badges?: LessonBadge[];
  runRewards?: LessonRunReward[];
  lessonStars?: LessonStars[];
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
    remove?: boolean,
  ): Promise<LearnerSnapshot>;
}

export function learnerName(name: string) {
  const value = name.trim().slice(0, 40);
  if (!value) throw new Error('Please give your learner a name.');
  return value;
}

export function validateEncounter(event: Encounter) {
  const lesson = event.lesson
    ? lessonById(event.lesson.id, event.lesson.revision)
    : undefined;
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
    [
      event.firstResponseMs,
      event.durationMs,
      ...(event.fluentResponseMs === undefined ? [] : [event.fluentResponseMs]),
    ].some((ms) => ms !== null && (!Number.isFinite(ms) || ms < 0))
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
  const lesson = event.lesson
    ? lessonById(event.lesson.id, event.lesson.revision)!
    : undefined;
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
  const runRewards = snapshot.learner.runRewards ?? [];
  const assessment = lesson
    ? assessLesson(lesson, encounters, event.lesson!.runId)
    : undefined;
  const alreadyAwarded =
    lesson &&
    (lesson.revision === 1
      ? badges.some((badge) => badge.lessonId === lesson.id)
      : hasBadge(snapshot, lesson.id));
  const award =
    lesson &&
    !alreadyAwarded &&
    (lesson.revision === 1
      ? assessment?.earned
      : (assessment?.stars ?? 0) >= 1);
  const runAward =
    lesson &&
    assessment?.mistakeFree &&
    !runRewards.some((reward) => reward.runId === event.lesson!.runId);
  return {
    ...snapshot,
    encounters,
    learner: {
      ...snapshot.learner,
      unlocked: advanceCurriculum(snapshot.learner.unlocked, encounters),
      ...(lesson &&
      assessment &&
      assessment.stars > bestStars(snapshot, lesson.id)
        ? {
            lessonStars: [
              ...(snapshot.learner.lessonStars ?? []).filter(
                (entry) => entry.lessonId !== lesson.id,
              ),
              {
                lessonId: lesson.id,
                revision: lesson.revision,
                runId: event.lesson!.runId,
                at: event.startedAt,
                stars: assessment.stars,
              },
            ],
          }
        : {}),
      ...(runAward
        ? {
            runRewards: [
              ...runRewards,
              {
                lessonId: lesson.id,
                revision: lesson.revision,
                runId: event.lesson!.runId,
                at: event.startedAt,
                gems: 1 as const,
              },
            ],
          }
        : {}),
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
    learner:
      item.slot === 'pet'
        ? { ...snapshot.learner, pet: item.id }
        : previewAccessory(snapshot.learner, item.id),
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
  remove = false,
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
  if (slot === 'pet') {
    if (remove) throw new Error('Choose a friend to play with.');
    return { ...snapshot, learner: { ...snapshot.learner, pet: itemId! } };
  }
  const accessories =
    itemId === null
      ? []
      : remove
        ? wearing(snapshot.learner).filter((id) => id !== itemId)
        : wearing(previewAccessory(snapshot.learner, itemId));
  return {
    ...snapshot,
    learner: {
      ...snapshot.learner,
      accessories,
      charm: remove || itemId === null ? (accessories.at(-1) ?? null) : itemId,
    },
  };
}

export type Outfit = Pick<Learner, 'pet' | 'charm' | 'accessories'>;
export type Accessory = Extract<(typeof rewards)[number], { slot: 'charm' }>;
export function accessory(id: string) {
  return rewards.find(
    (item): item is Accessory => item.slot === 'charm' && item.id === id,
  );
}

// Read older single-charm saves without a destructive database migration. Later
// choices win within a wear position; a fixed layer order keeps clothes beneath
// necklaces and headwear, regardless of the order the child puts them on.
export function wearing(
  learner: Pick<Learner, 'charm' | 'accessories'>,
): string[] {
  const saved = Array.isArray(learner.accessories)
    ? learner.accessories
    : learner.charm
      ? [learner.charm]
      : [];
  const slots = new Map<string, string>();
  for (const id of saved) {
    const item = accessory(id);
    if (item) slots.set(item.wear, id);
  }
  return [
    'back',
    'body',
    'neck',
    'charm',
    'bag',
    'ears',
    'eyes',
    'head',
  ].flatMap((slot) => (slots.has(slot) ? [slots.get(slot)!] : []));
}

export function previewAccessory<
  T extends Pick<Learner, 'charm' | 'accessories'>,
>(learner: T, id: string): T {
  const choice = accessory(id);
  if (!choice) return learner;
  return {
    ...learner,
    charm: id,
    accessories: [
      ...wearing(learner).filter((old) => accessory(old)?.wear !== choice.wear),
      id,
    ],
  };
}
