import { noteName, octave } from './music';
import styles from './Piano.module.css';
import { type PianoSession } from './usePianoSession';
export function Piano({ session }: { session: PianoSession }) {
  const {
    freePlay,
    hunting,
    playback,
    displayedTake,
    view,
    rangeOpen,
    setRangeOpen,
    pressed,
    hit,
    hintReady,
    releaseAll,
    play,
    connected,
    keyboard,
    keyLayout,
    keyHeight,
    shownPosition,
    expected,
  } = session;
  return (
    <>
      <section
        className={
          styles['keyboard-panel'] +
          ' ' +
          (view.size === 'kid' ? styles['kid-view'] : '')
        }
        aria-label="Live piano keyboard"
      >
        <div className={styles['keyboard-controls']}>
          <div
            className={styles['keyboard-zoom']}
            role="group"
            aria-label="Piano zoom"
          >
            <button
              type="button"
              aria-pressed={keyboard.zoom === 'close'}
              onClick={() => keyboard.setZoom('close')}
            >
              Close · middle C
            </button>
            <button
              type="button"
              aria-pressed={keyboard.zoom === 'all'}
              onClick={() => keyboard.setZoom('all')}
            >
              All {keyboard.range.high - keyboard.range.low + 1} keys
            </button>
          </div>
          <button
            type="button"
            className={styles['keyboard-range-button']}
            aria-label="Set keyboard range"
            aria-expanded={rangeOpen}
            onClick={() => {
              if (rangeOpen) keyboard.cancelLearning();
              setRangeOpen(!rangeOpen);
            }}
          >
            Range ⚙
          </button>
        </div>
        {rangeOpen && (
          <div
            className={styles['keyboard-range-setup']}
            aria-label="Keyboard range setup"
          >
            <select
              aria-label="Keyboard range"
              value={`${keyboard.range.low}:${keyboard.range.high}`}
              onChange={(event) => {
                const [low, high] = event.target.value.split(':').map(Number);
                keyboard.setRange({ low, high });
              }}
            >
              <option value="36:96">61 keys · C2–C7</option>
              <option value="21:108">88 keys · A0–C8</option>
              {!['36:96', '21:108'].includes(
                `${keyboard.range.low}:${keyboard.range.high}`,
              ) && (
                <option value={`${keyboard.range.low}:${keyboard.range.high}`}>
                  {noteName(keyboard.range.low)}
                  {octave(keyboard.range.low)}–{noteName(keyboard.range.high)}
                  {octave(keyboard.range.high)}
                </option>
              )}
            </select>
            {keyboard.calibrating ? (
              <>
                <span
                  className={styles['keyboard-range-instruction']}
                  role="status"
                >
                  {keyboard.rangeError ||
                    (keyboard.learningLow === null
                      ? 'Play the lowest key'
                      : 'Now play the highest key')}
                </span>
                <button type="button" onClick={keyboard.cancelLearning}>
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={!connected}
                onClick={() => {
                  releaseAll();
                  keyboard.startLearning();
                }}
              >
                Play end keys to set range
              </button>
            )}
          </div>
        )}
        <div className={styles['keyboard-scroll']}>
          <div
            className={
              styles['keyboard'] +
              ' ' +
              (keyboard.zoom === 'all' ? styles['all-keys'] : '')
            }
            style={
              {
                '--key-units': keyLayout.units,
                '--keyboard-ratio':
                  (keyLayout.units * (view.size === 'kid' ? 44 : 38) + 8) /
                  keyHeight,
              } as React.CSSProperties
            }
          >
            {keyLayout.keys.map(({ note, black, left, width }) => {
              const active = pressed.has(note) || playback.active.has(note);
              const keyHit = hunting
                ? null
                : freePlay
                  ? displayedTake.at(-1)
                  : hit;
              const hint =
                hintReady &&
                !freePlay &&
                !hunting &&
                !shownPosition.complete &&
                !hit &&
                note === expected;
              return (
                <button
                  type="button"
                  key={note}
                  className={
                    styles['piano-key'] +
                    ' ' +
                    (black ? styles['black'] : styles['white']) +
                    ' ' +
                    (active ? styles['pressed'] : '') +
                    ' ' +
                    (hint ? styles['expected'] : '') +
                    ' ' +
                    (freePlay || hunting
                      ? active
                        ? styles['hit']
                        : ''
                      : hit?.midi === note
                        ? styles['hit']
                        : '')
                  }
                  style={{ left: `${left}%`, width: `${width}%` }}
                  aria-label={`Play ${noteName(note)}${octave(note)}`}
                  aria-pressed={active}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    play(
                      { type: 'on', note, velocity: 90, channel: 0 },
                      `pointer-${event.pointerId}`,
                    );
                  }}
                  onPointerUp={(event) =>
                    play(
                      { type: 'off', note, velocity: 0, channel: 0 },
                      `pointer-${event.pointerId}`,
                    )
                  }
                  onLostPointerCapture={(event) =>
                    play(
                      { type: 'off', note, velocity: 0, channel: 0 },
                      `pointer-${event.pointerId}`,
                    )
                  }
                  onPointerCancel={(event) =>
                    play(
                      { type: 'off', note, velocity: 0, channel: 0 },
                      `pointer-${event.pointerId}`,
                    )
                  }
                  onClick={(event) => {
                    if (event.detail === 0) {
                      play(
                        { type: 'on', note, velocity: 90, channel: 0 },
                        'accessible',
                      );
                      play(
                        { type: 'off', note, velocity: 0, channel: 0 },
                        'accessible',
                      );
                    }
                  }}
                >
                  {keyHit?.midi === note && (
                    <span
                      className={styles['hit-spark']}
                      key={keyHit.id}
                      aria-hidden="true"
                    >
                      ✦
                    </span>
                  )}
                  {!black && (
                    <span
                      className={
                        styles['key-label'] +
                        ' ' +
                        (note === 60 ? styles['middle-c'] : '')
                      }
                    >
                      {noteName(note)}
                      {note % 12 === 0 && <small>{octave(note)}</small>}
                    </span>
                  )}
                  {hint && <i aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
