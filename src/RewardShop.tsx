import { useState } from 'react';
import { Backdrop } from './Backdrop';
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
import { SpokenHelp } from './SpokenHelp';
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
const backdrops = [
  {
    id: 'meadow',
    name: 'Meadow',
    description: '',
    cost: 0,
    currency: 'hearts',
    slot: 'backdrop',
  } as const,
  ...rewards.filter((item) => item.slot === 'backdrop'),
];
const charms = rewards.filter((item) => item.slot === 'charm');
const collections = [
  { id: 'all', name: 'All accessories', slots: [] },
  { id: 'halloween', name: '🎃 Halloween', slots: [] },
  { id: 'head', name: 'Hats & hair', slots: ['head'] },
  { id: 'face', name: 'Glasses & ears', slots: ['eyes', 'ears'] },
  { id: 'clothes', name: 'Clothes & wings', slots: ['body', 'neck', 'back'] },
  { id: 'trinkets', name: 'Charms & bags', slots: ['charm', 'bag'] },
  { id: 'owned', name: 'Yours', slots: [] },
  { id: 'wearing', name: 'Wearing', slots: [] },
];

export function RewardShop({
  controller,
  initialCategory = 'pet',
}: {
  controller: LearnersController;
  initialCategory?: 'pet' | 'charm';
}) {
  const { snapshot, busy, pendingCount } = controller;
  const [category, setCategory] = useState<'pet' | 'charm' | 'backdrop'>(
    initialCategory,
  );
  const [selected, setSelected] = useState(
    initialCategory === 'charm'
      ? (snapshot?.learner.charm ?? charms[0].id)
      : (snapshot?.learner.pet ?? 'fox'),
  );
  const [filterPage, setFilterPage] = useState(0);
  const [collection, setCollection] = useState('all');
  const [trying, setTrying] = useState(true);
  if (!snapshot) return null;
  const { learner, purchases } = snapshot;
  const worn = wearing(learner);
  const items =
    category === 'pet' ? friends : category === 'backdrop' ? backdrops : charms;
  const item = items.find((candidate) => candidate.id === selected) ?? items[0];
  const owned = (id: string) =>
    id === 'fox' ||
    id === 'meadow' ||
    purchases.some((purchase) => purchase.itemId === id);
  const isWorn = (id: string) =>
    id === learner.pet ||
    id === (learner.backdrop ?? 'meadow') ||
    worn.includes(id);
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
      : item.slot === 'backdrop'
        ? { ...learner, backdrop: item.id }
        : trying
          ? previewAccessory(learner, item.id)
          : learner;
  const filters =
    category !== 'charm'
      ? collections
          .filter((filter) => ['all', 'owned', 'wearing'].includes(filter.id))
          .map((filter) =>
            filter.id === 'all'
              ? {
                  ...filter,
                  name: category === 'pet' ? 'All friends' : 'All places',
                }
              : filter,
          )
      : collections;
  function matches(id: string, filter: string) {
    if (filter === 'owned') return owned(id);
    if (filter === 'wearing') return isWorn(id);
    if (filter === 'all') return true;
    if (filter === 'halloween') {
      const piece = accessory(id);
      return !!piece && 'theme' in piece && piece.theme === 'halloween';
    }
    return (
      collections
        .find((group) => group.id === filter)
        ?.slots.includes(accessory(id)?.wear ?? '') ?? false
    );
  }
  const choices = items.filter((choice) => matches(choice.id, collection));
  function changeCategory(slot: 'pet' | 'charm' | 'backdrop') {
    setTrying(true);
    setCategory(slot);
    setCollection('all');
    setFilterPage(0);
    setSelected(
      slot === 'pet'
        ? learner.pet
        : slot === 'backdrop'
          ? (learner.backdrop ?? 'meadow')
          : (learner.charm ?? charms[0].id),
    );
  }
  return (
    <section className={styles['shop']} aria-label="Reward shop">
      <nav className={styles['categories']} aria-label="Reward categories">
        <button
          type="button"
          aria-pressed={category === 'pet'}
          onClick={() => changeCategory('pet')}
        >
          <span aria-hidden="true">🐾</span> Friends
        </button>
        <button
          type="button"
          aria-pressed={category === 'charm'}
          onClick={() => changeCategory('charm')}
        >
          <span aria-hidden="true">🎩</span> Dress up
        </button>
        <button
          type="button"
          aria-pressed={category === 'backdrop'}
          onClick={() => changeCategory('backdrop')}
        >
          <span aria-hidden="true">🏞️</span> Places
        </button>
        <SpokenHelp text="Choose a friend, a hat, or a place. Tap a picture to try it. Tap Get to buy it with your hearts or gems. A check means it is yours." />
      </nav>
      <div className={styles['browse']}>
        <div className={styles['showcase']}>
          <div className={styles['stage']} aria-label="Outfit preview">
            <Backdrop id={preview.backdrop} />
            <div
              key={`${preview.pet}-${wearing(preview).join('-')}`}
              className={styles['companion']}
            >
              <Pet learner={preview} />
            </div>
            <span className={styles['preview-label']}>
              {equipped ? '✓' : '👆'}
            </span>
          </div>
          <div className={styles['detail']}>
            <h3>{item.name}</h3>
            <button
              type="button"
              className={styles['choose']}
              disabled={
                disabled ||
                (equipped && item.slot !== 'charm') ||
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
                  void controller.equip(
                    item.slot,
                    item.id === 'meadow' ? null : item.id,
                  );
                } else {
                  void controller.buy(item.id);
                }
              }}
            >
              {equipped
                ? item.slot === 'charm'
                  ? '↶ Off'
                  : '✓'
                : owned(item.id)
                  ? '✓ Use'
                  : `${item.currency === 'gems' ? '💎' : '♥'} ${item.cost} · Get`}
            </button>
            <span className={styles['ownership']} role="status">
              {owned(item.id)
                ? '✓ Yours'
                : remaining > 0
                  ? `${remaining} more ${remaining === 1 ? (item.currency === 'gems' ? 'gem' : 'heart') : item.currency} to collect`
                  : '👆 Get'}
            </span>
          </div>
        </div>
        <div className={styles['collection']}>
          <nav className={styles['filter']} aria-label="Shop filters">
            {category === 'charm' && worn.length > 0 && (
              <button
                type="button"
                aria-label="Take off all accessories"
                disabled={disabled}
                onClick={() => {
                  setTrying(false);
                  void controller.equip('charm', null);
                }}
              >
                <span aria-hidden="true">↶</span>
                <small>Off</small>
              </button>
            )}
            {filters
              .slice(filterPage * 3, (filterPage + 1) * 3)
              .map((filter) => (
                <button
                  type="button"
                  key={filter.id}
                  aria-label={filter.name.replace('🎃 ', '')}
                  aria-pressed={collection === filter.id}
                  onClick={() => {
                    setTrying(true);
                    setCollection(filter.id);
                    setSelected(
                      items.find((choice) => matches(choice.id, filter.id))
                        ?.id ?? item.id,
                    );
                  }}
                >
                  <span aria-hidden="true">
                    {
                      (
                        {
                          all: '▦',
                          halloween: '🎃',
                          head: '🎩',
                          face: '👓',
                          clothes: '👕',
                          trinkets: '👜',
                          owned: '✓',
                          wearing: '🐾',
                        } as Record<string, string>
                      )[filter.id]
                    }
                  </span>
                  <small>
                    {
                      (
                        {
                          all: 'All',
                          halloween: 'Spooky',
                          head: 'Hats',
                          face: 'Face',
                          clothes: 'Clothes',
                          trinkets: 'Bags',
                          owned: 'Yours',
                          wearing: 'On',
                        } as Record<string, string>
                      )[filter.id]
                    }
                  </small>
                </button>
              ))}
            {filters.length > 3 && (
              <button
                type="button"
                aria-label="More shop filters"
                onClick={() =>
                  setFilterPage(
                    (filterPage + 1) % Math.ceil(filters.length / 3),
                  )
                }
              >
                <span aria-hidden="true">→</span>
                <small>
                  {filterPage + 1}/{Math.ceil(filters.length / 3)}
                </small>
              </button>
            )}
          </nav>
          <section
            className={styles['gallery']}
            aria-label={
              category === 'pet'
                ? 'Friend gallery'
                : category === 'backdrop'
                  ? 'Backdrop gallery'
                  : 'Accessory gallery'
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
                {choice.slot === 'backdrop' ? (
                  <span className={styles['scene-thumb']}>
                    <Backdrop id={choice.id} />
                  </span>
                ) : (
                  <Pet
                    learner={
                      choice.slot === 'pet'
                        ? { ...learner, pet: choice.id }
                        : { pet: learner.pet, charm: choice.id }
                    }
                  />
                )}
                <strong>{choice.name}</strong>
                <small>
                  {isWorn(choice.id)
                    ? '✓ On'
                    : owned(choice.id)
                      ? '✓ Yours'
                      : `${choice.currency === 'gems' ? '💎' : '♥'} ${choice.cost}`}
                </small>
              </button>
            ))}
            {choices.length === 0 && <p>👆 ▦ All</p>}
          </section>
        </div>
      </div>
    </section>
  );
}
