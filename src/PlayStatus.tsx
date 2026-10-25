import { noteName, octave } from './music';
import styles from './PlayStatus.module.css';
import { type PianoSession } from './usePianoSession';
export function PlayStatus({ session }: { session: PianoSession }) {
  const { freePlay, lastNote, hit, hintReady, shownPosition, expected, reset } =
    session;
  return (
    <>
      <div
        className={
          styles['play-status'] +
          ' ' +
          (hit ? styles['has-hit'] : hintReady ? styles['has-hint'] : '')
        }
      >
        <span aria-live="polite">
          {freePlay ? (
            lastNote === null ? (
              '—'
            ) : (
              `You played ${noteName(lastNote)}${octave(lastNote)}`
            )
          ) : hit ? (
            <span className={styles['hit-badge']}>
              {noteName(hit.midi)}
              {octave(hit.midi)} ✓
              <span className={styles['hit-duration']} aria-hidden="true">
                <i
                  key={hit.id}
                  style={{ animationDuration: `${hit.durationMs}ms` }}
                />
              </span>
            </span>
          ) : shownPosition.complete ? (
            'You played the whole song!'
          ) : hintReady ? (
            `Find ${noteName(expected)}${expected === 60 ? ' · middle C' : ` · octave ${octave(expected)}`}`
          ) : (
            '\u00a0'
          )}
        </span>
        {shownPosition.complete && !freePlay && (
          <button type="button" onClick={reset}>
            Play again
          </button>
        )}
        {lastNote !== null && !freePlay && (
          <span className={styles['last-note']}>
            Played: {noteName(lastNote)}
            {octave(lastNote)}
          </span>
        )}
      </div>
    </>
  );
}
