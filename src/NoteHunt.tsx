import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { type HuntLevel, type HuntState, huntLevels } from './hunt';
import { type Note, noteName, octave, type Song } from './music';
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
}: {
  midi: number | null;
  title: string;
  matched: boolean;
  played?: boolean;
}) {
  const notes = useMemo<Note[]>(() => [{ midi: midi ?? 60, beats: 2 }], [midi]);
  return (
    <section
      className={`hunt-card ${matched ? 'matched' : ''} ${played ? 'played-card' : ''}`}
      aria-label={title}
    >
      <span className="hunt-card-title">{title}</span>
      {midi === null ? (
        <div className="hunt-empty" aria-label="Waiting for a note">
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
        />
      )}
      <span className="hunt-note-name">
        {midi === null ? 'Your turn…' : label(midi)}
      </span>
    </section>
  );
}

export function NoteHunt({
  state,
  onLevel,
  onReset,
}: {
  state: HuntState;
  onLevel: (level: HuntLevel) => void;
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
      className={`practice note-hunt ${state.found ? 'hunt-found' : ''}`}
      aria-label="Note hunt"
    >
      <div className="practice-controls hunt-controls">
        <select
          aria-label="Note range"
          value={state.level}
          onChange={(e) => onLevel(e.target.value as HuntLevel)}
        >
          {Object.entries(huntLevels).map(([key, level]) => (
            <option key={key} value={key}>
              {level.label}
            </option>
          ))}
        </select>
        <span className="hunt-points" aria-label={`${state.points} points`}>
          ♥ {state.points}
        </span>
        <span className="phrase-count">{state.solved} found</span>
        <button
          type="button"
          className="restart"
          onClick={onReset}
          aria-label="Restart note hunt"
          title="Restart note hunt"
        >
          ↺
        </button>
      </div>
      <div className="hunt-cards">
        <NoteCard midi={state.target} title="Find this" matched={state.found} />
        <NoteCard
          midi={state.played}
          title="You played"
          played
          matched={state.found}
        />
      </div>
      <div className="hunt-feedback" aria-live="polite" aria-atomic="true">
        <span
          className="hunt-hearts"
          aria-label={
            state.found
              ? `${state.reward} hearts earned`
              : `${hearts} hearts available`
          }
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={i < hearts ? 'earned' : ''}
              aria-hidden="true"
            >
              ♥
            </span>
          ))}
        </span>
        <span>{message}</span>
        <span className="hunt-bonus">
          {state.found && state.reward > 0 ? `+${state.reward}` : '\u00a0'}
        </span>
      </div>
      {state.found && (
        <div className="hunt-confetti" key={state.solved} aria-hidden="true">
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
