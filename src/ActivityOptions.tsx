import styles from './ActivityOptions.module.css';
import { assetUrl } from './assets';
import { downloadMusicXml } from './RecordingMenu';
import type { PianoSession } from './usePianoSession';
import type { ScoreSize } from './view';

export function ActivityOptions({ session }: { session: PianoSession }) {
  const {
    freePlay,
    song,
    view,
    setView,
    hints,
    setHints,
    midi,
    preview,
    recorder,
  } = session;
  return (
    <details className={styles['options']}>
      <summary>Options</summary>
      <div className={styles['option-panel']}>
        <label>
          Score size
          <select
            aria-label="Score size"
            value={view.size}
            onChange={(event) =>
              setView((previous) => ({
                ...previous,
                size: event.target.value as ScoreSize,
              }))
            }
          >
            <option value="compact">Compact</option>
            <option value="kid">Kid</option>
          </select>
        </label>
        <label className={styles['hint-toggle']}>
          <input
            type="checkbox"
            checked={view.multiline}
            onChange={(event) =>
              setView((previous) => ({
                ...previous,
                multiline: event.target.checked,
              }))
            }
          />
          Multiline
        </label>
        {!freePlay && (
          <label className={styles['hint-toggle']}>
            <input
              type="checkbox"
              checked={hints}
              onChange={(event) => setHints(event.target.checked)}
            />
            Idle hints
          </label>
        )}
        {!freePlay &&
          (midi.outputs.length > 0 || midi.outputChoice !== 'auto') && (
            <label>
              Phrase sound
              <select
                aria-label="Phrase sound"
                value={midi.outputChoice}
                onChange={(event) => {
                  preview.stop();
                  midi.setOutput(event.target.value);
                }}
              >
                <option value="auto">
                  Auto · {midi.automaticOutput?.name || 'Speakers'}
                </option>
                <option value="speakers">Speakers</option>
                {midi.outputs.map((output) => (
                  <option key={output.id} value={output.id}>
                    {output.name || output.id}
                  </option>
                ))}
                {!['auto', 'speakers'].includes(midi.outputChoice) &&
                  !midi.outputs.some(
                    (output) => output.id === midi.outputChoice,
                  ) && (
                    <option value={midi.outputChoice}>
                      Saved output unavailable · Speakers
                    </option>
                  )}
              </select>
            </label>
          )}
        {!freePlay && song.source && (
          <a
            className={styles['source-link']}
            href={assetUrl(song.source.image)}
            target="_blank"
            rel="noreferrer"
          >
            Book photo ↗
          </a>
        )}
        {freePlay && (
          <button
            type="button"
            disabled={!recorder.count}
            onClick={() => downloadMusicXml(recorder.getNotes())}
          >
            MusicXML ↓
          </button>
        )}
      </div>
    </details>
  );
}
