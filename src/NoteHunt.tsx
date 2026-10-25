import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import activityControlsStyles from './ActivityControls.module.css';
import { type HuntLevel, type HuntState, huntLevels } from './hunt';
import { type Note, noteName, octave, type Song } from './music';
import styles from './NoteHunt.module.css';
import pianoWorkspaceStyles from './PianoWorkspace.module.css';
import { Score } from './Score';

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
}: {
  midi: number | null;
  title: string;
  matched: boolean;
  played?: boolean;
  onReady?: () => void;
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
      <span className={styles['hunt-card-title']}>{title}</span>
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

export function NoteHunt({
  state,
  onLevel,
  onReset,
  adaptive,
  roundId,
  detail,
  onReady,
}: {
  state: HuntState;
  onLevel: (level: HuntLevel | 'adaptive') => void;
  adaptive: boolean;
  roundId: string;
  detail: string;
  onReady: () => void;
  onReset: () => void;
}) {
  const hearts = state.found ? state.reward : Math.max(0, 3 - state.attempts);
  const message = state.found
    ? state.reward === 3
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
        <span
          className={styles['hunt-points']}
          aria-label={`${state.points} points`}
        >
          ♥ {state.points}
        </span>
        <span className={activityControlsStyles['phrase-count']}>
          {state.solved} found
        </span>
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
      <p className={styles['learning-reason']}>{detail}</p>
      <div className={styles['hunt-cards']}>
        <NoteCard
          key={roundId}
          midi={state.target}
          title="Find this"
          matched={state.found}
          onReady={onReady}
        />
        <NoteCard
          midi={state.played}
          title="You played"
          played
          matched={state.found}
        />
      </div>
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
              className={i < hearts ? styles['earned'] : ''}
              aria-hidden="true"
            >
              ♥
            </span>
          ))}
        </span>
        <span>{message}</span>
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
