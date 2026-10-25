import { useState } from 'react';
import { ActivityMenu } from './ActivityMenu';
import styles from './App.module.css';
import { DeviceSettings } from './DeviceSettings';
import { LearnerMenu } from './LearnerMenu';
import { progress } from './learners';
import { Pet } from './Pet';
import { PianoWorkspace } from './PianoWorkspace';
import { useHuntSession } from './useHuntSession';
import { useLearners } from './useLearners';
import { type Activity, usePianoSession } from './usePianoSession';

export function App() {
  const [mode, setMode] = useState<Activity>('home');
  const [learnersOpen, setLearnersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const learners = useLearners();
  const playing = mode === 'practice' || mode === 'explore' || mode === 'hunt';
  const blocked = learnersOpen || settingsOpen;
  const hunt = useHuntSession(
    learners.snapshot,
    learners.record,
    mode === 'hunt' && !blocked,
  );
  const session = usePianoSession(mode, hunt, blocked);
  const stats = learners.snapshot ? progress(learners.snapshot) : null;
  function navigate(next: Activity) {
    session.reset();
    session.setRecordingsOpen(false);
    session.keyboard.cancelLearning();
    session.setRangeOpen(false);
    setMode(next);
  }
  return (
    <main className={styles['app']}>
      <header className={styles['header']}>
        <button
          type="button"
          className={styles['home-button']}
          onClick={() => navigate('home')}
          aria-label="Home"
        >
          {playing || mode === 'songs' ? '‹ Home' : '♫ Kidmidi'}
        </button>
        <span className={styles['activity-title']}>
          {mode === 'practice'
            ? session.song.title
            : mode === 'hunt'
              ? 'Note hunt'
              : mode === 'explore'
                ? 'Free play'
                : ''}
        </span>
        <div className={styles['header-actions']}>
          <button
            type="button"
            className={styles['device-button']}
            aria-label={session.connected?.name || 'Connect keyboard'}
            title="Keyboard settings"
            disabled={!session.midi.supported || session.midi.requesting}
            onClick={() => {
              if (!session.connected) {
                void session.midi.connect();
                return;
              }
              session.releaseAll();
              setSettingsOpen(true);
            }}
          >
            <span aria-hidden="true">{session.connected ? '●' : '⌨'}</span>
            <span className={styles['device-label']}>
              {session.connected?.name || 'Keyboard'}
            </span>
          </button>
          <button
            type="button"
            className={styles['learner-button']}
            aria-label="Learners and rewards"
            disabled={!learners.snapshot}
            onClick={() => {
              session.releaseAll();
              setLearnersOpen(true);
            }}
          >
            {learners.snapshot && (
              <Pet learner={learners.snapshot.learner} small />
            )}
            <span className={styles['learner-label']}>
              {learners.snapshot?.learner.name ?? 'Loading…'}
            </span>
            <span>{stats ? `Lv ${stats.level} · ♥ ${stats.balance}` : ''}</span>
          </button>
        </div>
      </header>
      {(!session.midi.supported ||
        (!session.connected && session.midi.status)) && (
        <p className={styles['midi-status']} role="status">
          {session.midi.supported
            ? session.midi.status
            : 'MIDI needs Chrome and HTTPS or localhost.'}
        </p>
      )}
      {learners.error && (
        <div className={styles['save-warning']} role="alert">
          {learners.error} Progress stays in this tab until saved.{' '}
          <button type="button" onClick={() => void learners.retry()}>
            Retry saving
          </button>
        </div>
      )}
      {playing ? (
        <PianoWorkspace session={session} />
      ) : (
        <ActivityMenu
          snapshot={learners.snapshot}
          choosingSong={mode === 'songs'}
          onChoose={navigate}
          onSong={(id) => {
            session.setSongId(id);
            navigate('practice');
          }}
        />
      )}
      {learnersOpen && (
        <LearnerMenu
          key={learners.snapshot?.learner.id}
          controller={learners}
          onClose={() => setLearnersOpen(false)}
        />
      )}
      {settingsOpen && (
        <DeviceSettings
          session={session}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </main>
  );
}
