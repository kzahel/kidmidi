import type { CSSProperties, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import activityControlsStyles from './ActivityControls.module.css';
import { type Lesson, lessonLength, nextStarGoal } from './curriculum';
import type { NoteHit } from './feedback';
import { type HuntLevel, type HuntState, huntLevels } from './hunt';
import { LessonStars } from './LessonStars';
import { type Note, noteName, octave, type Song } from './music';
import styles from './NoteHunt.module.css';
import pianoWorkspaceStyles from './PianoWorkspace.module.css';
import type { ScoreAttempt } from './played-note';
import { Score } from './Score';
import type { LessonResult } from './useHuntSession';

const cardSong: Song = {
  id: 'note-card',
  title: '',
  subtitle: '',
  icon: '',
  timeSignature: { beats: 2, beatType: 4 },
  phrases: [],
};
const confetti = Array.from({ length: 32 }, (_, index) => ({
  x: `${(index * 37 + 9) % 100}%`,
  color: ['#edb94e', '#ec8ba4', '#64b697', '#87aee7'][index % 4],
  drift: `${((index * 29) % 140) - 70}px`,
  delay: `${(index % 7) * 35}ms`,
  turn: `${index * 83}deg`,
}));

function label(midi: number) {
  return midi === 60 ? 'C4 · middle C' : `${noteName(midi)}${octave(midi)}`;
}

function NoteCard({
  midi,
  title,
  matched,
  played,
  onReady,
  icon,
}: {
  midi: number | null;
  title: string;
  matched: boolean;
  played?: boolean;
  onReady?: () => void;
  icon?: string;
}) {
  const notes = useMemo<Note[]>(() => [{ midi: midi ?? 60, beats: 2 }], [midi]);
  return (
    <section
      className={
        styles['hunt-card'] +
        ' ' +
        (matched ? styles['matched'] : '') +
        ' ' +
        (played ? styles['played-card'] : '')
      }
      aria-label={title}
    >
      <span className={styles['hunt-card-title']} aria-hidden={Boolean(icon)}>
        {icon ?? title}
      </span>
      {midi === null ? (
        <div className={styles['hunt-empty']} aria-label="Waiting for a note">
          ♪
        </div>
      ) : (
        <Score
          notes={notes}
          active={0}
          complete={false}
          song={cardSong}
          hit={null}
          hint={false}
          size="kid"
          flashcard
          onReady={onReady}
        />
      )}
      <span className={styles['hunt-note-name']}>
        {midi === null ? 'Your turn…' : label(midi)}
      </span>
    </section>
  );
}

function PatternCard({
  pattern,
  found,
  onReady,
  played,
  hit,
  attempt,
  hint,
}: {
  pattern: { pitches: number[]; index: number };
  found: boolean;
  onReady(): void;
  played: number | null;
  hit: NoteHit | null;
  attempt: ScoreAttempt | null;
  hint: boolean;
}) {
  const [pitches] = useState(pattern.pitches);
  const song = useMemo<Song>(
    () => ({
      ...cardSong,
      id: 'pattern-card',
      timeSignature: { beats: pitches.length, beatType: 4 },
    }),
    [pitches],
  );
  const notes = useMemo<Note[]>(
    () => pitches.map((midi) => ({ midi, beats: 1 })),
    [pitches],
  );
  return (
    <section
      className={`${styles['hunt-card']} ${styles['pattern-card']} ${found ? styles['matched'] : ''}`}
      aria-label="Play this pattern"
      data-long={pitches.length > 6 || undefined}
    >
      <span className={styles['hunt-card-title']}>
        Play from left to right · take your time
      </span>
      <Score
        notes={notes}
        active={
          hit?.position.note ?? Math.min(pattern.index, pitches.length - 1)
        }
        complete={found && !hit}
        song={song}
        hit={hit}
        attempt={attempt}
        hint={hint}
        size="kid"
        flashcard
        onReady={onReady}
      />
      <div
        className={styles['pattern-progress']}
        aria-label={`${pattern.index} of ${pitches.length} pattern notes found`}
      >
        {pitches.map((midi, index) => (
          <span
            key={`${index}-${midi}`}
            className={index < pattern.index ? styles['pattern-done'] : ''}
            aria-current={index === pattern.index ? 'step' : undefined}
          >
            <span className={styles['pattern-number']}>
              {index < pattern.index ? '✓' : index + 1}{' '}
            </span>
            {noteName(midi)}
          </span>
        ))}
      </div>
      <span
        className={`${styles['hunt-note-name']} ${hint ? styles['pattern-hint-name'] : ''}`}
      >
        {hint
          ? `Next: ${label(pitches[pattern.index])}`
          : played === null
            ? 'Follow the shape ↑ ↓'
            : `You played ${label(played)}`}
      </span>
    </section>
  );
}

export function NoteHunt({
  state,
  onLevel,
  onReset,
  adaptive,
  roundId,
  detail,
  onReady,
  lesson,
  result,
  onMap,
  pattern,
  patternHit,
  patternAttempt,
  hint,
  options,
}: {
  state: HuntState;
  pattern: { pitches: number[]; index: number; id: string } | null;
  patternHit: NoteHit | null;
  patternAttempt: ScoreAttempt | null;
  hint: boolean;
  options?: ReactNode;
  onLevel: (level: HuntLevel | 'adaptive') => void;
  adaptive: boolean;
  roundId: string;
  detail: string;
  onReady: () => void;
  onReset: () => void;
  lesson?: Lesson;
  result: LessonResult | null;
  onMap(): void;
}) {
  const multiplier = lesson?.heartMultiplier ?? 1;
  const hearts = state.found
    ? state.reward
    : Math.max(0, 3 - state.attempts) * multiplier;
  if (result && lesson)
    return (
      <section
        className={`${pianoWorkspaceStyles['practice']} ${styles['lesson-result']}`}
        aria-label="Lesson complete"
      >
        <span className={styles['result-icon']}>
          <LessonStars stars={result.stars} label="This run" />
        </span>
        <p aria-label={`${result.hearts} hearts earned`}>
          ♥ +{result.hearts}{' '}
          {result.gems > 0 && <span>· 💎 +{result.gems}</span>}
        </p>
        {(result.runGems > 0 || result.badgeGems > 0) && (
          <span className={styles['result-gems']}>
            {result.runGems > 0 && <span>No mistakes · 💎 +1</span>}
            {result.badgeGems > 0 && (
              <span>First star · 💎 +{result.badgeGems}</span>
            )}
          </span>
        )}
        <span className={styles['result-best']}>
          <span>Best</span>
          <LessonStars stars={result.best} />
          <span>{nextStarGoal(lesson, result.best)}</span>
        </span>
        <div>
          <button
            type="button"
            onClick={onReset}
            aria-label="Play lesson again"
          >
            ↺
          </button>
          <button type="button" onClick={onMap} aria-label="Learning map">
            All lessons →
          </button>
        </div>
      </section>
    );
  const message = state.found
    ? pattern
      ? 'Pattern found! ✨'
      : state.attempts === 1
        ? 'First try! ✨'
        : 'Found it! ✨'
    : state.played === null
      ? 'Find the matching note'
      : state.played < state.target
        ? 'A little higher ↑'
        : 'A little lower ↓';
  return (
    <section
      className={
        pianoWorkspaceStyles['practice'] +
        ' ' +
        styles['note-hunt'] +
        (pattern ? ' ' + styles['pattern-hunt'] : '') +
        ' ' +
        (state.found ? styles['hunt-found'] : '')
      }
      aria-label="Note hunt"
    >
      <div
        className={
          activityControlsStyles['practice-controls'] +
          ' ' +
          styles['hunt-controls']
        }
      >
        {lesson ? (
          <span
            className={styles['lesson-count']}
            aria-label={`${state.solved} of ${lessonLength(lesson)} notes`}
          >
            {lesson.name} · {state.solved}/{lessonLength(lesson)}
          </span>
        ) : (
          <select
            aria-label="Note range"
            value={adaptive ? 'adaptive' : state.level}
            onChange={(e) => onLevel(e.target.value as HuntLevel | 'adaptive')}
          >
            <option value="adaptive">My learning path</option>
            {Object.entries(huntLevels).map(([key, level]) => (
              <option key={key} value={key}>
                {level.label}
              </option>
            ))}
          </select>
        )}
        <span
          className={styles['hunt-points']}
          aria-label={`${state.points} points`}
        >
          ♥ {state.points}
        </span>
        {options}
        <button
          type="button"
          className={activityControlsStyles['restart']}
          onClick={onReset}
          aria-label="Restart note hunt"
          title="Restart note hunt"
        >
          ↺
        </button>
      </div>
      {!lesson && <p className={styles['learning-reason']}>{detail}</p>}
      {pattern ? (
        <PatternCard
          key={pattern.id}
          pattern={pattern}
          found={state.found}
          onReady={onReady}
          played={state.played}
          hit={patternHit}
          attempt={patternAttempt}
          hint={hint}
        />
      ) : (
        <div className={styles['hunt-cards']}>
          <NoteCard
            key={roundId}
            midi={state.target}
            title="Find this"
            matched={state.found}
            onReady={onReady}
            icon={lesson ? '🎯' : undefined}
          />
          <NoteCard
            midi={state.played}
            title="You played"
            played
            matched={state.found}
            icon={lesson ? '🎹' : undefined}
          />
        </div>
      )}
      <div
        className={styles['hunt-feedback']}
        aria-live="polite"
        aria-atomic="true"
      >
        <span
          className={styles['hunt-hearts']}
          aria-label={
            state.found
              ? `${state.reward} hearts earned`
              : `${hearts} hearts available`
          }
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={i * multiplier < hearts ? styles['earned'] : ''}
              aria-hidden="true"
            >
              ♥
            </span>
          ))}
        </span>
        <span aria-label={lesson ? message : undefined}>
          {lesson
            ? state.found
              ? '✨'
              : state.played === null
                ? '♪'
                : state.played < state.target
                  ? '↑'
                  : '↓'
            : message}
        </span>
        <span className={styles['hunt-bonus']}>
          {state.found && state.reward > 0 ? `+${state.reward}` : '\u00a0'}
        </span>
      </div>
      {state.found && (
        <div
          className={styles['hunt-confetti']}
          key={state.solved}
          aria-hidden="true"
        >
          {confetti.map((piece, i) => (
            <i
              key={piece.x}
              style={
                {
                  left: piece.x,
                  backgroundColor: piece.color,
                  '--drift': piece.drift,
                  '--turn': piece.turn,
                  animationDelay: piece.delay,
                  borderRadius: i % 3 === 0 ? '50%' : '1px',
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
