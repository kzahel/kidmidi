import { useState } from 'react';
import { journeyProgress, lessonById, worlds } from './curriculum';
import { Dialog } from './Dialog';
import styles from './LearnerMenu.module.css';
import { progress, rewards } from './learners';
import { curriculum, noteEvidence } from './learning';
import { noteName, octave } from './music';
import { Pet } from './Pet';
import type { LearnersController } from './useLearners';

export function LearnerMenu({
  controller,
  onClose,
}: {
  controller: LearnersController;
  onClose(): void;
}) {
  const { snapshot, learners, busy, pendingCount } = controller;
  const [name, setName] = useState('');
  const [rename, setRename] = useState(snapshot?.learner.name ?? '');
  if (!snapshot) return null;
  const { learner, purchases } = snapshot;
  const stats = progress(snapshot);
  const journey = journeyProgress(snapshot);
  const disabled = busy || pendingCount > 0;
  return (
    <Dialog title="Learners & rewards" onClose={onClose}>
      <div className={styles['profile-summary']}>
        <Pet learner={learner} />
        <div>
          <h3>{learner.name}</h3>
          <p>
            {journey.badges} badges · ♥ {stats.balance} · 💎{' '}
            {journey.gemBalance}
          </p>
          <p>{stats.earned} hearts earned, forever</p>
        </div>
      </div>
      <label className={styles['field']}>
        Who's playing?
        <select
          aria-label="Current learner"
          value={learner.id}
          disabled={disabled}
          onChange={(event) => void controller.select(event.target.value)}
        >
          {learners.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </label>
      <form
        className={styles['name-form']}
        onSubmit={(event) => {
          event.preventDefault();
          void controller.rename(rename);
        }}
      >
        <label className={styles['field']}>
          Learner name
          <input
            aria-label="Learner name"
            maxLength={40}
            value={rename}
            onChange={(event) => setRename(event.target.value)}
          />
        </label>
        <button type="submit" disabled={disabled || !rename.trim()}>
          Rename
        </button>
      </form>
      <form
        className={styles['name-form']}
        onSubmit={(event) => {
          event.preventDefault();
          void controller.create(name).then(() => setName(''));
        }}
      >
        <label className={styles['field']}>
          Add a learner
          <input
            aria-label="New learner name"
            placeholder="Their name"
            maxLength={40}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button type="submit" disabled={disabled || !name.trim()}>
          Add learner
        </button>
      </form>
      <h3>Friends & little treasures</h3>
      <p className={styles['quiet']}>
        ♥ for practice. 💎 for new badges. Yours forever.
      </p>
      <div className={styles['shop']}>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={learner.pet === 'fox'}
          onClick={() => void controller.equip('pet', 'fox')}
        >
          <span aria-hidden="true">🦊</span>
          <strong>Fox friend</strong>
          <small>
            {learner.pet === 'fox' ? 'Playing with you' : 'Choose · yours'}
          </small>
        </button>
        {rewards.map((item) => {
          const owned = purchases.some(
            (purchase) => purchase.itemId === item.id,
          );
          const equipped = learner[item.slot] === item.id;
          return (
            <button
              type="button"
              key={item.id}
              disabled={
                disabled ||
                (!owned &&
                  (item.currency === 'gems'
                    ? journey.gemBalance
                    : stats.balance) < item.cost)
              }
              aria-pressed={equipped}
              aria-label={`${owned ? 'Choose' : 'Get'} ${item.name}${owned ? '' : ` for ${item.cost} ${item.currency}`}`}
              onClick={() =>
                void (owned
                  ? controller.equip(item.slot, item.id)
                  : controller.buy(item.id))
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              <strong>{item.name}</strong>
              <small>
                {equipped
                  ? 'With you'
                  : owned
                    ? 'Choose · yours'
                    : `${item.currency === 'gems' ? '💎' : '♥'} ${item.cost}`}
              </small>
            </button>
          );
        })}
      </div>
      {learner.charm && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => void controller.equip('charm', null)}
        >
          Take off charm
        </button>
      )}
      <details className={styles['learning-details']}>
        <summary>Learning notes · for grown-ups</summary>
        <p>
          Garden lessons show note names. Treehouse lessons hide them until 💡
          or a match; using help is saved and does not count toward a reading
          badge. Badges require a complete, balanced set: 80% first-try finds
          and at least one for every note. Each badge gives gems once. The
          optional Quick badge also needs those finds within four seconds; there
          is no countdown or deadline.
        </p>
        <p>
          Choose any implemented lesson from Lessons, including reading and
          patterns. No earlier badge or heart purchase is needed. Coming soon
          topics are not playable yet. Hearts buy friends and charms; gems buy
          the puppy. Existing badges, friends and past purchases stay saved.
        </p>
        <ul>
          {(learner.badges ?? []).map((badge) => {
            const lesson = lessonById(badge.lessonId);
            const world = worlds.find((world) => world.id === lesson?.world);
            return (
              <li key={badge.lessonId}>
                {lesson?.icon ?? '🏅'} {world?.name} ·{' '}
                {lesson?.name ?? badge.lessonId}
              </li>
            );
          })}
        </ul>
        <p>Recent finds across modes, including help: last 12 per note.</p>
        <ul>
          {curriculum.slice(0, learner.unlocked).map((note) => {
            const evidence = noteEvidence(snapshot.encounters, note);
            return (
              <li key={note}>
                {noteName(note)}
                {octave(note)}:{' '}
                {evidence.seen
                  ? `${Math.round(evidence.accuracy * 100)}% first try · ${evidence.days} successful days${evidence.medianMs === null ? '' : ` · ${(evidence.medianMs / 1000).toFixed(1)}s typical`}`
                  : 'Ready to discover'}
              </li>
            );
          })}
        </ul>
      </details>
      {controller.error && (
        <p role="alert">
          {controller.error}{' '}
          <button type="button" onClick={() => void controller.retry()}>
            Retry saving
          </button>
        </p>
      )}
      <p className={styles['quiet']}>
        Learners, hearts and rewards are saved on this browser.
      </p>
    </Dialog>
  );
}
