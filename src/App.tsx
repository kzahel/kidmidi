import { useState } from 'react';
import { ActivityMenu } from './ActivityMenu';
import styles from './App.module.css';
import { WardrobeArt } from './ChoiceArt';
import { journeyProgress } from './curriculum';
import { DeviceSettings } from './DeviceSettings';
import { LearnerMenu } from './LearnerMenu';
import { LearningMap } from './LearningMap';
import { progress } from './learners';
import { Pet } from './Pet';
import { PianoWorkspace } from './PianoWorkspace';
import { stopSpokenHelp } from './SpokenHelp';
import { soundRoutes } from './sound-settings';
import { useHuntSession } from './useHuntSession';
import { useLearners } from './useLearners';
import { type Activity, usePianoSession } from './usePianoSession';

export function App() {
  const [mode, setMode] = useState<Activity>('home');
  const [learnersOpen, setLearnersOpen] = useState(false);
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const learners = useLearners();
  const playing = mode === 'practice' || mode === 'explore' || mode === 'hunt';
  const blocked = learnersOpen || wardrobeOpen || settingsOpen;
  const hunt = useHuntSession(
    learners.snapshot,
    learners.record,
    mode === 'hunt' && !blocked,
  );
  const session = usePianoSession(mode, hunt, blocked, settingsOpen);
  const soundRoute = soundRoutes.find(
    (route) => route.id === session.soundSettings.route,
  )!;
  const soundLabel = session.soundError
    ? 'Screen fallback'
    : session.soundSettings.route === 'auto'
      ? session.connected
        ? 'Auto · Keys + Screen'
        : 'Auto · Screen'
      : session.soundSettings.route === 'keyboard' && !session.midi.output
        ? 'Keyboard · Screen fallback'
        : soundRoute.label;
  const stats = learners.snapshot ? progress(learners.snapshot) : null;
  function navigate(next: Activity) {
    stopSpokenHelp();
    session.sound.speaker.unlock();
    session.reset();
    session.setRecordingsOpen(false);
    session.keyboard.cancelLearning();
    session.setRangeOpen(false);
    setMode(next);
  }
  function openWardrobe() {
    stopSpokenHelp();
    session.releaseAll();
    session.keyboard.cancelLearning();
    session.setRangeOpen(false);
    setWardrobeOpen(true);
  }
  return (
    <main className={styles['app']}>
      <header
        className={`${styles['header']} ${mode === 'hunt' ? styles['hunting'] : ''}`}
      >
        <button
          type="button"
          className={styles['home-button']}
          onClick={() => navigate('home')}
          aria-label="Home"
        >
          <span aria-hidden="true">⌂</span>
          <span className={styles['nav-label']}>Home</span>
        </button>
        {mode === 'hunt' ? (
          <button
            type="button"
            className={styles['lessons-button']}
            aria-label="Back to lessons"
            onClick={() => navigate('path')}
          >
            <span aria-hidden="true">←</span>
            <span className={styles['nav-label']}>Lessons</span>
          </button>
        ) : (
          <span className={styles['activity-title']}>
            {mode === 'practice'
              ? session.song.title
              : mode === 'explore'
                ? 'Free play'
                : ''}
          </span>
        )}
        <div className={styles['header-actions']}>
          <button
            type="button"
            className={styles['wardrobe-button']}
            aria-label="Wardrobe"
            disabled={!learners.snapshot}
            onClick={openWardrobe}
          >
            <WardrobeArt />
          </button>
          <button
            type="button"
            className={styles['device-button']}
            aria-label="Sound and settings"
            aria-description={`${soundLabel}. ${session.soundSettings.sound.name}.`}
            title="Sound and settings"
            onClick={() => {
              session.sound.speaker.unlock();
              session.releaseAll();
              session.keyboard.cancelLearning();
              session.setRangeOpen(false);
              stopSpokenHelp();
              setSettingsOpen(true);
            }}
          >
            <span className={styles['device-icon']} aria-hidden="true">
              🔊
            </span>
            <span aria-hidden="true">⚙</span>
          </button>
          <button
            type="button"
            className={styles['learner-button']}
            aria-label="Learners and rewards"
            disabled={!learners.snapshot}
            onClick={() => {
              session.releaseAll();
              session.keyboard.cancelLearning();
              session.setRangeOpen(false);
              stopSpokenHelp();
              setLearnersOpen(true);
            }}
          >
            {learners.snapshot && (
              <Pet learner={learners.snapshot.learner} small />
            )}
            <span className={styles['learner-label']}>
              {learners.snapshot?.learner.name ?? 'Loading…'}
            </span>
            <span>
              {stats && learners.snapshot
                ? `★ ${journeyProgress(learners.snapshot).stars} · ♥ ${stats.balance}`
                : ''}
            </span>
          </button>
        </div>
      </header>
      {learners.error && (
        <div className={styles['save-warning']} role="alert">
          {learners.error}{' '}
          {learners.pendingCount > 0 &&
            'New hearts stay in this tab until saved.'}{' '}
          <button
            type="button"
            disabled={learners.busy}
            onClick={() => void learners.retry()}
          >
            Retry saving
          </button>
        </div>
      )}
      {playing ? (
        <PianoWorkspace
          session={session}
          learner={learners.snapshot?.learner}
          onMap={() => navigate('path')}
        />
      ) : mode === 'path' ? (
        <LearningMap
          key={learners.snapshot?.learner.id}
          controller={learners}
          initialWorld={hunt.lesson?.world}
          onLesson={(id) => {
            navigate('hunt');
            hunt.chooseLesson(id);
          }}
          onPractice={() => {
            navigate('hunt');
            hunt.chooseRange('adaptive');
          }}
        />
      ) : (
        <ActivityMenu
          snapshot={learners.snapshot}
          choosingSong={mode === 'songs'}
          onWardrobe={openWardrobe}
          onListen={session.hearSong}
          listening={
            session.previewState.playing ? session.listeningSong : null
          }
          stopListening={() => session.preview.stop()}
          onChoose={(activity) =>
            navigate(activity === 'hunt' ? 'path' : activity)
          }
          onSong={(id) => {
            session.setSongId(id);
            navigate('practice');
          }}
        />
      )}
      {wardrobeOpen && (
        <LearnerMenu
          controller={learners}
          wardrobe
          onClose={() => {
            stopSpokenHelp();
            setWardrobeOpen(false);
          }}
        />
      )}
      {learnersOpen && (
        <LearnerMenu
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
