import { useState } from 'react';
import { journeyProgress } from './curriculum';
import {
  accessory,
  previewAccessory,
  progress,
  rewards,
  wearing,
} from './learners';
import { Pet } from './Pet';
import styles from './RewardShop.module.css';
import type { LearnersController } from './useLearners';

const fox = {
  id: 'fox',
  name: 'Fox friend',
  description: 'Your first piano pal. Always yours.',
  cost: 0,
  currency: 'hearts',
  slot: 'pet',
} as const;
const friends = [fox, ...rewards.filter((item) => item.slot === 'pet')];
const charms = rewards.filter((item) => item.slot === 'charm');
const collections = [
  { id: 'all', name: 'All accessories', slots: [] },
  { id: 'head', name: 'Hats & hair', slots: ['head'] },
  { id: 'face', name: 'Glasses & ears', slots: ['eyes', 'ears'] },
  { id: 'clothes', name: 'Clothes & wings', slots: ['body', 'neck', 'back'] },
  { id: 'trinkets', name: 'Charms & bags', slots: ['charm', 'bag'] },
  { id: 'owned', name: 'Yours', slots: [] },
  { id: 'wearing', name: 'Wearing', slots: [] },
];

export function RewardShop({ controller }: { controller: LearnersController }) {
  const { snapshot, busy, pendingCount } = controller;
  const [category, setCategory] = useState<'pet' | 'charm'>('pet');
  const [selected, setSelected] = useState(snapshot?.learner.pet ?? 'fox');
  const [collection, setCollection] = useState('all');
  const [trying, setTrying] = useState(true);
  if (!snapshot) return null;
  const { learner, purchases } = snapshot;
  const worn = wearing(learner);
  const items = category === 'pet' ? friends : charms;
  const item = items.find((candidate) => candidate.id === selected) ?? items[0];
  const owned = (id: string) =>
    id === 'fox' || purchases.some((purchase) => purchase.itemId === id);
  const isWorn = (id: string) => id === learner.pet || worn.includes(id);
  const equipped = isWorn(item.id);
  const balance =
    item.currency === 'gems'
      ? journeyProgress(snapshot).gemBalance
      : progress(snapshot).balance;
  const remaining = Math.max(0, item.cost - balance);
  const disabled = busy || pendingCount > 0;
  const preview =
    item.slot === 'pet'
      ? { ...learner, pet: item.id }
      : trying
        ? previewAccessory(learner, item.id)
        : learner;
  const replacement =
    item.slot === 'charm'
      ? worn
          .map(accessory)
          .find((old) => old?.wear === item.wear && old.id !== item.id)
      : undefined;
  const filters =
    category === 'pet'
      ? collections
          .filter((filter) => ['all', 'owned', 'wearing'].includes(filter.id))
          .map((filter) =>
            filter.id === 'all' ? { ...filter, name: 'All friends' } : filter,
          )
      : collections;
  function matches(id: string, filter: string) {
    if (filter === 'owned') return owned(id);
    if (filter === 'wearing') return isWorn(id);
    if (filter === 'all') return true;
    return (
      collections
        .find((group) => group.id === filter)
        ?.slots.includes(accessory(id)?.wear ?? '') ?? false
    );
  }
  const choices = items.filter((choice) => matches(choice.id, collection));
  function changeCategory(slot: 'pet' | 'charm') {
    setTrying(true);
    setCategory(slot);
    setCollection('all');
    setSelected(slot === 'pet' ? learner.pet : (learner.charm ?? charms[0].id));
  }
  return (
    <section className={styles['shop']} aria-label="Reward shop">
      <nav className={styles['categories']} aria-label="Reward categories">
        <button
          type="button"
          aria-pressed={category === 'pet'}
          onClick={() => changeCategory('pet')}
        >
          Friends
        </button>
        <button
          type="button"
          aria-pressed={category === 'charm'}
          onClick={() => changeCategory('charm')}
        >
          Dress up
        </button>
        {category === 'charm' && worn.length > 0 ? (
          <button
            type="button"
            aria-label="Take off all accessories"
            disabled={disabled}
            onClick={() => {
              setTrying(false);
              void controller.equip('charm', null);
            }}
          >
            Take all off
          </button>
        ) : (
          <span>
            {items.filter((choice) => owned(choice.id)).length}/{items.length}{' '}
            collected
          </span>
        )}
      </nav>
      <div className={styles['browse']}>
        <div className={styles['showcase']}>
          <div className={styles['stage']} aria-label="Outfit preview">
            <span className={styles['stage-note']} aria-hidden="true">
              ♫
            </span>
            <div
              key={`${preview.pet}-${wearing(preview).join('-')}`}
              className={styles['companion']}
            >
              <Pet learner={preview} />
            </div>
            <span className={styles['preview-label']}>
              {equipped
                ? 'Playing with you'
                : trying
                  ? 'Try it on'
                  : 'Your outfit'}
            </span>
          </div>
          <div className={styles['detail']}>
            <h3>{item.name}</h3>
            <p>
              {item.description}
              {replacement
                ? ` Replaces ${replacement.name.toLowerCase()}.`
                : ''}
            </p>
            <button
              type="button"
              className={styles['choose']}
              disabled={
                disabled ||
                (equipped && item.slot === 'pet') ||
                (!owned(item.id) && remaining > 0)
              }
              aria-label={
                equipped
                  ? item.slot === 'charm'
                    ? `Take off ${item.name}`
                    : `${item.name} equipped`
                  : owned(item.id)
                    ? `Choose ${item.name}`
                    : `Get ${item.name} for ${item.cost} ${item.currency}`
              }
              onClick={() => {
                if (equipped && item.slot === 'charm') {
                  setTrying(false);
                  void controller.equip('charm', item.id, true);
                } else if (owned(item.id)) {
                  void controller.equip(item.slot, item.id);
                } else {
                  void controller.buy(item.id);
                }
              }}
            >
              {equipped
                ? item.slot === 'charm'
                  ? 'Take off · wearing'
                  : '✓ With you'
                : owned(item.id)
                  ? 'Choose · yours'
                  : `${item.currency === 'gems' ? '💎' : '♥'} ${item.cost} · Make it yours`}
            </button>
            <span className={styles['ownership']} role="status">
              {owned(item.id)
                ? 'Yours forever'
                : remaining > 0
                  ? `${remaining} more ${remaining === 1 ? (item.currency === 'gems' ? 'gem' : 'heart') : item.currency} to collect`
                  : 'Ready to join you'}
            </span>
          </div>
        </div>
        <div className={styles['collection']}>
          <label className={styles['filter']}>
            <select
              aria-label={
                category === 'pet' ? 'Browse friends' : 'Browse accessories'
              }
              value={collection}
              onChange={(event) => {
                const next = event.target.value;
                setTrying(true);
                setCollection(next);
                setSelected(
                  items.find((choice) => matches(choice.id, next))?.id ??
                    item.id,
                );
              }}
            >
              {filters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.name}
                  {filter.id === 'wearing'
                    ? ` (${category === 'pet' ? 1 : worn.length})`
                    : ''}
                </option>
              ))}
            </select>
            <span>
              {choices.length} {category === 'pet' ? 'friends' : 'finds'} ·
              scroll to browse
            </span>
          </label>
          <section
            className={styles['gallery']}
            aria-label={
              category === 'pet' ? 'Friend gallery' : 'Accessory gallery'
            }
            tabIndex={0}
          >
            {choices.map((choice) => (
              <button
                type="button"
                key={choice.id}
                aria-label={`Preview ${choice.name}`}
                aria-pressed={choice.id === item.id}
                onClick={() => {
                  setTrying(true);
                  setSelected(choice.id);
                }}
              >
                <Pet
                  learner={
                    choice.slot === 'pet'
                      ? { ...learner, pet: choice.id }
                      : { pet: learner.pet, charm: choice.id }
                  }
                />
                <strong>{choice.name}</strong>
                <small>
                  {isWorn(choice.id)
                    ? '✓ Wearing'
                    : owned(choice.id)
                      ? '✓ Yours'
                      : `${choice.currency === 'gems' ? '💎' : '♥'} ${choice.cost}`}
                </small>
              </button>
            ))}
            {choices.length === 0 && (
              <p>
                No pieces here yet. Try All accessories to find something you
                like.
              </p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
