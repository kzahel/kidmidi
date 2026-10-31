import styles from './ActivityOptions.module.css';
import { assetUrl } from './assets';
import { StarRules } from './LessonStars';
import { downloadMusicXml } from './RecordingMenu';
import type { PianoSession } from './usePianoSession';
import type { ScoreSize } from './view';

export function ActivityOptions({ session }: { session: PianoSession }) {
  const { freePlay, hunting, song, view, setView, hints, setHints, recorder } =
    session;
  return (
    <details className={styles['options']}>
      <summary>
        <span aria-hidden="true">⚙</span> Options
      </summary>
      <div className={styles['option-panel']}>
        {!hunting && (
          <>
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
          </>
        )}
        {!freePlay && (!hunting || session.huntSession.pattern) && (
          <label className={styles['hint-toggle']}>
            <input
              type="checkbox"
              checked={hints}
              onChange={(event) => setHints(event.target.checked)}
            />
            Idle hints
          </label>
        )}
        {hunting && session.huntSession.lesson && (
          <StarRules lesson={session.huntSession.lesson} />
        )}
        {!freePlay && !hunting && song.source && (
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
