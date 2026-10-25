import styles from './ActivityControls.module.css';
import { ActivityOptions } from './ActivityOptions';
import type { PianoSession } from './usePianoSession';

export function ActivityControls({ session }: { session: PianoSession }) {
  const {
    freePlay,
    recorder,
    shownPosition,
    song,
    previewState,
    preview,
    pageNotes,
    midi,
    view,
    page,
    setRequestedPage,
    setRecordingsOpen,
    library,
    libraryState,
    clearExplorePage,
    reset,
    clearTake,
    player,
    playback,
  } = session;
  return (
    <div className={styles['practice-controls']}>
      <span className={styles['phrase-count']}>
        {freePlay
          ? `${recorder.count} notes · 4/4`
          : `Phrase ${shownPosition.phrase + 1} of ${song.phrases.length}`}
      </span>
      {freePlay ? (
        <>
          <button type="button" onClick={() => setRecordingsOpen(true)}>
            Recordings
          </button>
          <button
            type="button"
            disabled={!recorder.count}
            onClick={() => void library.flush()}
          >
            Save
          </button>
          <span className={styles['save-status']} role="status">
            {libraryState.status === 'saving'
              ? 'Saving…'
              : libraryState.status === 'saved'
                ? 'Saved'
                : libraryState.status === 'error'
                  ? 'Save failed'
                  : '\u00a0'}
          </span>
          <button type="button" onClick={clearExplorePage}>
            Clear page
          </button>
          {playback.playing && (
            <button type="button" onClick={() => player.stop()}>
              Stop playback
            </button>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              if (previewState.playing) preview.stop();
              else void preview.hear(pageNotes, midi.output);
            }}
          >
            <span aria-hidden="true">{previewState.playing ? '◼' : '▷'}</span>{' '}
            {previewState.playing ? 'Stop preview' : 'Hear this phrase'}
          </button>
          {view.multiline && page.count > 1 && (
            <span className={styles['page-controls']} aria-label="Score pages">
              <button
                type="button"
                aria-label="Previous score page"
                disabled={page.index === 0}
                onClick={() => {
                  preview.stop();
                  setRequestedPage(page.index - 1);
                }}
              >
                ‹
              </button>
              <span>
                Page {page.index + 1} of {page.count}
              </span>
              <button
                type="button"
                aria-label="Next score page"
                disabled={page.index + 1 === page.count}
                onClick={() => {
                  preview.stop();
                  setRequestedPage(page.index + 1);
                }}
              >
                ›
              </button>
            </span>
          )}
        </>
      )}
      <ActivityOptions session={session} />
      <button
        type="button"
        className={styles['restart']}
        onClick={freePlay ? clearTake : reset}
        aria-label={freePlay ? 'New recording' : 'Start again'}
        title={freePlay ? 'New recording' : 'Start again'}
      >
        ↺
      </button>
      {previewState.error && (
        <span className={styles['preview-status']} role="status">
          {previewState.error}
        </span>
      )}
    </div>
  );
}
