import { assetUrl } from './assets';
import styles from './PracticeScore.module.css';
import { Score } from './Score';
import { type PianoSession } from './usePianoSession';
export function PracticeScore({ session }: { session: PianoSession }) {
  const {
    song,
    freePlay,
    view,
    wholeSong,
    hit,
    attempt,
    hintReady,
    shownPosition,
    page,
    pageNotes,
    pageContainsCurrent,
    pageOffset,
    shownCount,
    playedCount,
    total,
    artBounds,
  } = session;
  return (
    <>
      {!freePlay && (
        <>
          <div
            className={
              styles['score-layout'] +
              ' ' +
              (song.source ? styles['illustrated'] : '')
            }
          >
            <Score
              notes={pageNotes}
              active={Math.max(0, shownCount - pageOffset)}
              complete={shownPosition.complete}
              song={song}
              wholeSong={wholeSong}
              phraseIndex={page.start}
              endPhrase={page.end}
              attempt={
                attempt &&
                attempt.position.phrase >= page.start &&
                attempt.position.phrase < page.end
                  ? {
                      midi: attempt.midi,
                      target: attempt.target,
                      index:
                        song.phrases
                          .slice(page.start, attempt.position.phrase)
                          .flat().length + attempt.position.note,
                    }
                  : null
              }
              hit={pageContainsCurrent ? hit : null}
              hint={pageContainsCurrent && hintReady}
              size={view.size}
            />
            {song.source && (
              <svg
                className={styles['book-illustration']}
                viewBox={song.source.illustrationViewBox}
                role="img"
                aria-label={song.source.illustrationAlt}
              >
                <title>{song.source.illustrationAlt}</title>
                <defs>
                  <clipPath id="song-illustration-crop">
                    <rect
                      x={artBounds?.[0]}
                      y={artBounds?.[1]}
                      width={artBounds?.[2]}
                      height={artBounds?.[3]}
                    />
                  </clipPath>
                </defs>
                <image
                  clipPath="url(#song-illustration-crop)"
                  href={assetUrl(song.source.image)}
                  width="1505"
                  height="2000"
                />
              </svg>
            )}
          </div>
          {song.source && (
            <div className={styles['score-credit']}>
              <span>{song.source.credit}</span>
              <a
                href={assetUrl('/scores/raege-raegetroepfli.musicxml')}
                download
              >
                MusicXML ↓
              </a>
            </div>
          )}
          <div
            className={styles['progress-track']}
            role="progressbar"
            aria-label="Song progress"
            aria-valuenow={playedCount}
            aria-valuemin={0}
            aria-valuemax={total}
          >
            <div style={{ width: `${(playedCount / total) * 100}%` }} />
          </div>
        </>
      )}
    </>
  );
}
