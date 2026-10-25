import { advanceCurriculum, type Encounter } from './learning';

export const rewards = [
  { id: 'cat', name: 'Cat friend', icon: '🐱', cost: 18, slot: 'pet' },
  { id: 'rabbit', name: 'Bunny friend', icon: '🐰', cost: 30, slot: 'pet' },
  { id: 'bow', name: 'Party bow', icon: '🎀', cost: 12, slot: 'charm' },
  { id: 'star', name: 'Star charm', icon: '🌟', cost: 24, slot: 'charm' },
] as const;
export type Learner = {
  id: string;
  name: string;
  createdAt: number;
  timeZone: string;
  unlocked: number;
  pet: string;
  charm: string | null;
};
export type Purchase = {
  id: string;
  learnerId: string;
  itemId: string;
  cost: number;
  at: number;
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
    (sum, purchase) => sum + purchase.cost,
    0,
  );
  const level = 1 + Math.floor(Math.sqrt(earned / 12));
  const floor = 12 * (level - 1) ** 2;
  const next = 12 * level ** 2;
  return {
    earned,
    balance: earned - spent,
    level,
    intoLevel: earned - floor,
    levelSize: next - floor,
    next,
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
    event.reward !== Math.max(0, 4 - event.guesses.length) ||
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
  const encounters = [...snapshot.encounters, event].sort(
    (a, b) => a.startedAt - b.startedAt || a.id.localeCompare(b.id),
  );
  return {
    ...snapshot,
    encounters,
    learner: {
      ...snapshot.learner,
      unlocked: advanceCurriculum(snapshot.learner.unlocked, encounters),
    },
  };
}

export function withPurchase(
  snapshot: LearnerSnapshot,
  itemId: string,
  id: string,
  at: number,
): LearnerSnapshot {
  const item = rewards.find((candidate) => candidate.id === itemId);
  if (!item) throw new Error('Unknown reward.');
  if (
    snapshot.purchases.some(
      (purchase) => purchase.id === id || purchase.itemId === itemId,
    )
  )
    return snapshot;
  if (progress(snapshot).balance < item.cost)
    throw new Error('Keep collecting hearts for this reward.');
  return {
    ...snapshot,
    learner: { ...snapshot.learner, [item.slot]: item.id },
    purchases: [
      ...snapshot.purchases,
      { id, learnerId: snapshot.learner.id, itemId, cost: item.cost, at },
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
