import styles from './ActivityMenu.module.css';
import { journeyProgress } from './curriculum';
import type { LearnerSnapshot } from './learners';
import { songs } from './music';
import { Pet } from './Pet';
import type { Activity } from './usePianoSession';

export function ActivityMenu({
  snapshot,
  choosingSong,
  onChoose,
  onSong,
}: {
  snapshot: LearnerSnapshot | null;
  choosingSong: boolean;
  onChoose(activity: Activity): void;
  onSong(id: string): void;
}) {
  const journey = snapshot ? journeyProgress(snapshot) : null;
  return (
    <section
      className={styles['menu']}
      aria-label={choosingSong ? 'Choose a song' : 'Activities'}
    >
      <div className={styles['welcome']}>
        <div>
          <p className={styles['eyebrow']}>A LITTLE PIANO TIME</p>
          <h1>
            {choosingSong
              ? 'Pick a song'
              : `Hello, ${snapshot?.learner.name ?? 'piano friend'}!`}
          </h1>
          <p>
            {choosingSong
              ? 'Play together, one note at a time.'
              : 'What shall we play today?'}
          </p>
          {journey && (
            <div className={styles['level']}>
              <span
                aria-label={`World ${journey.world}, ${journey.badges} badges, ${journey.gemBalance} gems`}
              >
                {journey.world} ✦ · 🏅 {journey.badges} · 💎{' '}
                {journey.gemBalance}
              </span>
            </div>
          )}
        </div>
        {snapshot && <Pet learner={snapshot.learner} />}
      </div>
      <div className={styles['activities']}>
        {choosingSong ? (
          songs.map((song) => (
            <button
              type="button"
              className={styles['song']}
              key={song.id}
              onClick={() => onSong(song.id)}
              aria-label={song.title}
            >
              <span className={styles['icon']} aria-hidden="true">
                {song.icon}
              </span>
              <strong>{song.title}</strong>
              <span>At your own pace</span>
              <b aria-hidden="true">↗</b>
            </button>
          ))
        ) : (
          <>
            <button
              type="button"
              className={styles['song']}
              onClick={() => onChoose('songs')}
              aria-label="Play a song"
            >
              <span className={styles['icon']} aria-hidden="true">
                ♫
              </span>
              <strong>Play a song</strong>
              <span>A melody, one note at a time</span>
              <b aria-hidden="true">↗</b>
            </button>
            <button
              type="button"
              className={styles['explore']}
              onClick={() => onChoose('explore')}
              aria-label="Just explore"
            >
              <span className={styles['icon']} aria-hidden="true">
                ✺
              </span>
              <strong>Free play</strong>
              <span>Make something all your own</span>
              <b aria-hidden="true">↗</b>
            </button>
            <button
              type="button"
              className={styles['hunt']}
              disabled={!snapshot}
              onClick={() => onChoose('hunt')}
              aria-label="Note hunt"
            >
              <span className={styles['icon']} aria-hidden="true">
                ♥
              </span>
              <strong>Note hunt</strong>
              <span>🗺️ ♥ 💎</span>
              <b aria-hidden="true">↗</b>
            </button>
          </>
        )}
      </div>
      <p className={styles['footnote']}>
        No rush. There’s always time for another note.
      </p>
    </section>
  );
}
