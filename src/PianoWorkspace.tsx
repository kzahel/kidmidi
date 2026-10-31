import { ActivityControls } from './ActivityControls';
import { ActivityOptions } from './ActivityOptions';
import { ExploreScore } from './ExploreScore';
import type { Learner } from './learners';
import { NoteHunt } from './NoteHunt';
import { Piano } from './Piano';
import styles from './PianoWorkspace.module.css';
import { PlayStatus } from './PlayStatus';
import { PracticeScore } from './PracticeScore';
import { RecordingDialog } from './RecordingDialog';
import { type PianoSession } from './usePianoSession';
export function PianoWorkspace({
  session,
  onMap,
  learner,
}: {
  session: PianoSession;
  learner?: Learner;
  onMap(): void;
}) {
  const {
    hunting,
    hunt,
    huntSession,
    freePlay,
    displayedTake,
    view,
    playback,
    afterGroup,
    libraryState,
  } = session;
  return (
    <>
      {hunting ? (
        <NoteHunt
          state={hunt}
          pattern={huntSession.pattern}
          patternHit={session.patternHit}
          patternAttempt={session.patternAttempt}
          hint={session.patternHint}
          options={
            huntSession.pattern ? (
              <ActivityOptions session={session} />
            ) : undefined
          }
          adaptive={huntSession.adaptive}
          roundId={huntSession.roundId}
          detail={huntSession.choice.detail}
          onReady={huntSession.ready}
          lesson={huntSession.lesson}
          result={huntSession.result}
          helped={huntSession.helped}
          onHelp={huntSession.help}
          onMap={onMap}
          onReset={() => {
            session.releaseAll();
            huntSession.reset();
          }}
          onLevel={(level) => {
            session.releaseAll();
            huntSession.chooseRange(level);
          }}
        />
      ) : (
        <section className={styles['practice']} aria-label="Piano practice">
          <ActivityControls session={session} />

          {freePlay && (
            <>
              <ExploreScore
                notes={displayedTake}
                multiline={view.multiline}
                size={view.size}
                afterGroup={playback.playing ? 0 : afterGroup}
              />
              {libraryState.error && (
                <p className={styles['recording-save-error']} role="alert">
                  {libraryState.error}
                </p>
              )}
            </>
          )}
          <PracticeScore session={session} />
          <PlayStatus session={session} />
        </section>
      )}
      <RecordingDialog session={session} />
      <Piano session={session} learner={learner} />
    </>
  );
}
