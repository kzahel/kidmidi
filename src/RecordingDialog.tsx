import { RecordingMenu } from './RecordingMenu';
import { type PianoSession } from './usePianoSession';
export function RecordingDialog({ session }: { session: PianoSession }) {
  const {
    libraryState,
    library,
    recorder,
    recordingsOpen,
    setRecordingsOpen,
    setAfterGroup,
    player,
    releaseAll,
    clearTake,
    loadRecording,
    readRecording,
  } = session;
  return (
    <>
      {recordingsOpen && (
        <RecordingMenu
          state={libraryState}
          onClose={() => setRecordingsOpen(false)}
          read={readRecording}
          onLoad={loadRecording}
          onPlay={async (id) => {
            await loadRecording(id);
            player.play(recorder.getNotes());
          }}
          onDelete={async (id) => {
            if (id === library.state.current?.id) clearTake();
            await library.remove(id);
          }}
          onImport={async (title, notes) => {
            releaseAll();
            await library.import(title, recorder, notes);
            setAfterGroup(0);
          }}
        />
      )}
    </>
  );
}
