import { useState } from 'react';
import { journeyProgress, lessonById } from './curriculum';
import { Dialog } from './Dialog';
import styles from './LearnerMenu.module.css';
import { progress } from './learners';
import { curriculum, noteEvidence } from './learning';
import { noteName, octave } from './music';
import { RewardShop } from './RewardShop';
import type { LearnersController } from './useLearners';

function Profiles({ controller }: { controller: LearnersController }) {
  const { snapshot, learners, busy, pendingCount } = controller;
  const [name, setName] = useState('');
  const [rename, setRename] = useState(snapshot?.learner.name ?? '');
  if (!snapshot) return null;
  const disabled = busy || pendingCount > 0;
  return (
    <section className={styles['profiles']} aria-label="Learner profiles">
      <h3>{snapshot.learner.name}</h3>
      <label className={styles['field']}>
        Who's playing?
        <select
          aria-label="Current learner"
          value={snapshot.learner.id}
          disabled={disabled}
          onChange={(event) => void controller.select(event.target.value)}
        >
          {learners.map((learner) => (
            <option key={learner.id} value={learner.id}>
              {learner.name}
            </option>
          ))}
        </select>
      </label>
      <div className={styles['forms']}>
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
            void controller.create(name);
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
      </div>
      <p className={styles['quiet']}>
        Saved on this browser. Each learner keeps their own finds and rewards.
      </p>
    </section>
  );
}

function LearningProgress({ controller }: { controller: LearnersController }) {
  const [view, setView] = useState('finds');
  const [page, setPage] = useState(0);
  const snapshot = controller.snapshot;
  if (!snapshot) return null;
  const notes = curriculum.slice(0, snapshot.learner.unlocked);
  const badges = snapshot.learner.badges ?? [];
  const total =
    view === 'about' ? 2 : view === 'finds' ? notes.length : badges.length;
  return (
    <section className={styles['progress']} aria-label="Learning progress">
      <label className={styles['field']}>
        Show progress
        <select
          aria-label="Progress view"
          value={view}
          onChange={(event) => {
            setView(event.target.value);
            setPage(0);
          }}
        >
          <option value="finds">Recent finds</option>
          <option value="badges">Lesson badges</option>
          <option value="about">How badges work</option>
        </select>
      </label>
      <div
        className={`${styles['evidence']} ${view === 'about' ? styles['about'] : ''}`}
      >
        {view === 'about' ? (
          <>
            <article>
              <strong>First-try finds</strong>
              <span>
                Finish a complete set: 80% first try and one success for every
                pitch. New badges give gems once. Replays earn hearts.
              </span>
            </article>
            <article>
              <strong>Reading & Quick</strong>
              <span>
                Reading badges need finds without name help. Optional Quick adds
                a four-second threshold. Other lessons ignore speed. Pauses
                never cost hearts.
              </span>
            </article>
          </>
        ) : view === 'finds' ? (
          notes.slice(page * 4, (page + 1) * 4).map((note) => {
            const evidence = noteEvidence(snapshot.encounters, note);
            return (
              <article key={note}>
                <strong>
                  {noteName(note)}
                  {octave(note)}
                </strong>
                <span>
                  {evidence.seen
                    ? `${Math.round(evidence.accuracy * 100)}% first try · ${evidence.days} days`
                    : 'Ready to discover'}
                </span>
                <small>
                  {evidence.seen} finds
                  {evidence.medianMs === null
                    ? ' · names may help'
                    : ` · ${(evidence.medianMs / 1000).toFixed(1)}s typical`}
                </small>
              </article>
            );
          })
        ) : (
          badges.slice(page * 4, (page + 1) * 4).map((badge) => {
            const lesson = lessonById(badge.lessonId);
            return (
              <article key={badge.lessonId}>
                <strong>🏅 {lesson?.name ?? badge.lessonId}</strong>
                <span>{lesson?.description}</span>
                <small>Yours forever</small>
              </article>
            );
          })
        )}
        {view !== 'about' && total === 0 && (
          <p>Try any lesson to collect your first badge.</p>
        )}
      </div>
      <div className={styles['pages']}>
        <button
          type="button"
          aria-label="Previous progress page"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          ← Back
        </button>
        <span>
          {page + 1} / {Math.max(1, Math.ceil(total / 4))}
        </span>
        <button
          type="button"
          aria-label="Next progress page"
          disabled={(page + 1) * 4 >= total}
          onClick={() => setPage(page + 1)}
        >
          More →
        </button>
      </div>
    </section>
  );
}

export function LearnerMenu({
  controller,
  onClose,
}: {
  controller: LearnersController;
  onClose(): void;
}) {
  const [tab, setTab] = useState('Rewards');
  const { snapshot } = controller;
  if (!snapshot) return null;
  const stats = progress(snapshot);
  const journey = journeyProgress(snapshot);
  return (
    <Dialog title="Learners & rewards" onClose={onClose} fitted>
      <nav className={styles['tabs']} aria-label="Learner sections">
        {['Rewards', 'Learners', 'Progress'].map((name) => (
          <button
            type="button"
            key={name}
            aria-pressed={tab === name}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </nav>
      <div className={styles['wallet']}>
        <span>
          {journey.badges} badges · ♥ {stats.balance} · 💎 {journey.gemBalance}
        </span>
        <span>{stats.earned} hearts earned, forever</span>
      </div>
      <div className={styles['panel']}>
        {tab === 'Rewards' ? (
          <RewardShop key={snapshot.learner.id} controller={controller} />
        ) : tab === 'Learners' ? (
          <Profiles key={snapshot.learner.id} controller={controller} />
        ) : (
          <LearningProgress key={snapshot.learner.id} controller={controller} />
        )}
      </div>
      {controller.error && (
        <p className={styles['error']} role="alert">
          {controller.error}{' '}
          <button type="button" onClick={() => void controller.retry()}>
            Retry saving
          </button>
        </p>
      )}
    </Dialog>
  );
}
