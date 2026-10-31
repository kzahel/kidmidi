import styles from './ActivityMenu.module.css';
import { PetScene } from './Backdrop';
import { ActivityArt, WardrobeArt } from './ChoiceArt';
import { journeyProgress } from './curriculum';
import type { LearnerSnapshot } from './learners';
import { songs } from './music';
import { Pet } from './Pet';
import { SpokenHelp } from './SpokenHelp';
import type { Activity } from './usePianoSession';

export function ActivityMenu({
  snapshot,
  choosingSong,
  onChoose,
  onSong,
  onWardrobe,
  onListen,
  listening,
  stopListening,
}: {
  snapshot: LearnerSnapshot | null;
  choosingSong: boolean;
  onChoose(activity: Activity): void;
  onSong(id: string): void;
  onWardrobe(): void;
  onListen(id: string): void;
  listening: string | null;
  stopListening(): void;
}) {
  const journey = snapshot ? journeyProgress(snapshot) : null;
  return (
    <section
      className={styles['menu']}
      aria-label={choosingSong ? 'Choose a song' : 'Activities'}
    >
      <div className={styles['welcome']}>
        <div>
          <h1>
            {choosingSong
              ? 'Pick a song'
              : `Hello, ${snapshot?.learner.name ?? 'friend'}!`}
          </h1>
          {journey && (
            <div className={styles['level']}>
              <span
                aria-label={`${journey.stars} stars, ${journey.gemBalance} gems`}
              >
                ★ {journey.stars} · 💎 {journey.gemBalance}
              </span>
            </div>
          )}
          <SpokenHelp
            beforeSpeak={stopListening}
            text={
              choosingSong
                ? 'Tap a picture to play a song. Tap the speaker to listen first.'
                : 'Choose a song, make your own music, or find some notes. Tap the wardrobe to dress your friend and choose a place.'
            }
          />
        </div>
        {snapshot && (
          <div className={styles['pet-home']}>
            <PetScene id={snapshot.learner.backdrop}>
              <Pet learner={snapshot.learner} />
            </PetScene>
            <button
              type="button"
              aria-label="Open wardrobe"
              onClick={onWardrobe}
            >
              <WardrobeArt />
              <span>Dress up</span>
            </button>
          </div>
        )}
      </div>
      <div className={styles['activities']}>
        {choosingSong ? (
          songs.map((song) => (
            <article className={styles['song-card']} key={song.id}>
              <button
                type="button"
                className={styles['song']}
                onClick={() => onSong(song.id)}
                aria-label={song.title}
              >
                <span className={styles['picture']}>
                  <ActivityArt kind={song.id} />
                </span>
                <strong>{song.title}</strong>
                <b aria-hidden="true">▶</b>
              </button>
              <button
                type="button"
                className={styles['listen']}
                aria-label={
                  listening === song.id
                    ? `Stop listening to ${song.title}`
                    : `Listen to ${song.title}`
                }
                aria-pressed={listening === song.id}
                onClick={() =>
                  listening === song.id ? stopListening() : onListen(song.id)
                }
              >
                <span aria-hidden="true">
                  {listening === song.id ? '■' : '🔊'}
                </span>
                <span>{listening === song.id ? 'Stop' : 'Listen'}</span>
              </button>
            </article>
          ))
        ) : (
          <>
            <button
              type="button"
              className={styles['song']}
              onClick={() => onChoose('songs')}
              aria-label="Play a song"
            >
              <span className={styles['picture']}>
                <ActivityArt kind="twinkle" />
              </span>
              <strong>Songs</strong>
              <b aria-hidden="true">▶</b>
            </button>
            <button
              type="button"
              className={styles['explore']}
              onClick={() => onChoose('explore')}
              aria-label="Just explore"
            >
              <span className={styles['picture']}>
                <ActivityArt kind="piano" />
              </span>
              <strong>Free play</strong>
              <b aria-hidden="true">▶</b>
            </button>
            <button
              type="button"
              className={styles['hunt']}
              disabled={!snapshot}
              onClick={() => onChoose('hunt')}
              aria-label="Note hunt"
            >
              <span className={styles['picture']}>
                <ActivityArt kind="hunt" />
              </span>
              <strong>Note hunt</strong>
              <b aria-hidden="true">▶</b>
            </button>
          </>
        )}
      </div>
    </section>
  );
}
