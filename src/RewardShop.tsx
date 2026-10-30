import { useState } from 'react';
import { journeyProgress } from './curriculum';
import { progress, rewards } from './learners';
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
const pageSize = 2;

export function RewardShop({ controller }: { controller: LearnersController }) {
  const { snapshot, busy, pendingCount } = controller;
  const [category, setCategory] = useState<'pet' | 'charm'>('pet');
  const [selected, setSelected] = useState(snapshot?.learner.pet ?? 'fox');
  const [page, setPage] = useState(() =>
    Math.floor(
      Math.max(
        0,
        friends.findIndex((item) => item.id === snapshot?.learner.pet),
      ) / pageSize,
    ),
  );
  if (!snapshot) return null;
  const { learner, purchases } = snapshot;
  const items = category === 'pet' ? friends : charms;
  const item = items.find((candidate) => candidate.id === selected) ?? items[0];
  const owned = (id: string) =>
    id === 'fox' || purchases.some((purchase) => purchase.itemId === id);
  const equipped = learner[item.slot] === item.id;
  const balance =
    item.currency === 'gems'
      ? journeyProgress(snapshot).gemBalance
      : progress(snapshot).balance;
  const remaining = Math.max(0, item.cost - balance);
  const disabled = busy || pendingCount > 0;
  const preview = { ...learner, [item.slot]: item.id };
  function changeCategory(slot: 'pet' | 'charm') {
    const list = slot === 'pet' ? friends : charms;
    const index = Math.max(
      0,
      list.findIndex((candidate) => candidate.id === learner[slot]),
    );
    setCategory(slot);
    setSelected(list[index].id);
    setPage(Math.floor(index / pageSize));
  }
  function changePage(next: number) {
    setPage(next);
    setSelected(items[next * pageSize].id);
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
        {category === 'charm' && learner.charm ? (
          <button
            type="button"
            aria-label="Take off charm"
            disabled={disabled}
            onClick={() => void controller.equip('charm', null)}
          >
            Take off
          </button>
        ) : (
          <span>
            {items.filter((candidate) => owned(candidate.id)).length}/
            {items.length} collected
          </span>
        )}
      </nav>
      <div className={styles['showcase']}>
        <div className={styles['stage']} aria-label="Outfit preview">
          <span className={styles['stage-note']} aria-hidden="true">
            ♫
          </span>
          <div
            key={`${preview.pet}-${preview.charm}`}
            className={styles['companion']}
          >
            <Pet learner={preview} />
          </div>
          <span className={styles['preview-label']}>
            {equipped ? 'Playing with you' : 'Try it on'}
          </span>
        </div>
        <div className={styles['detail']}>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <button
            type="button"
            className={styles['choose']}
            disabled={
              disabled || equipped || (!owned(item.id) && remaining > 0)
            }
            aria-label={
              equipped
                ? `${item.name} equipped`
                : owned(item.id)
                  ? `Choose ${item.name}`
                  : `Get ${item.name} for ${item.cost} ${item.currency}`
            }
            onClick={() =>
              void (owned(item.id)
                ? controller.equip(item.slot, item.id)
                : controller.buy(item.id))
            }
          >
            {equipped
              ? '✓ With you'
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
      <div
        className={styles['shelf']}
        aria-label={
          category === 'pet' ? 'Friend collection' : 'Charm collection'
        }
      >
        {items.slice(page * pageSize, (page + 1) * pageSize).map((choice) => (
          <button
            type="button"
            key={choice.id}
            aria-label={`Preview ${choice.name}`}
            aria-pressed={choice.id === item.id}
            onClick={() => setSelected(choice.id)}
          >
            <Pet learner={{ ...learner, [choice.slot]: choice.id }} />
            <span>
              <strong>{choice.name}</strong>
              <small>
                {owned(choice.id)
                  ? learner[choice.slot] === choice.id
                    ? '✓ With you'
                    : '✓ Yours'
                  : `${choice.currency === 'gems' ? '💎' : '♥'} ${choice.cost}`}
              </small>
            </span>
          </button>
        ))}
      </div>
      <nav className={styles['pagination']} aria-label="Reward pages">
        <button
          type="button"
          aria-label="Previous rewards"
          disabled={page === 0}
          onClick={() => changePage(page - 1)}
        >
          ← Back
        </button>
        <select
          aria-label="Reward page"
          value={page}
          onChange={(event) => changePage(Number(event.target.value))}
        >
          {Array.from(
            { length: Math.ceil(items.length / pageSize) },
            (_, index) => (
              <option key={index} value={index}>
                {index + 1} / {Math.ceil(items.length / pageSize)} ·{' '}
                {items
                  .slice(index * pageSize, (index + 1) * pageSize)
                  .map((choice) => choice.name)
                  .join(' & ')}
              </option>
            ),
          )}
        </select>
        <button
          type="button"
          aria-label="Next rewards"
          disabled={(page + 1) * pageSize >= items.length}
          onClick={() => changePage(page + 1)}
        >
          More →
        </button>
      </nav>
    </section>
  );
}
