import { useEffect, useState } from 'react';
import { ExploreRecorder, type PlayedNote } from './explore';
import { emptyPlayback, RecordingPlayer } from './playback';
import { emptyLibrary, RecordingLibrary } from './recordings';
import type { NoteSound } from './sound-output';
export function useExploreSession(freePlay: boolean, sound: NoteSound) {
  const [take, setTake] = useState<PlayedNote[]>([]);
  const [libraryState, setLibraryState] = useState(emptyLibrary);
  const [library] = useState(() => new RecordingLibrary(setLibraryState));
  const [recorder] = useState(
    () =>
      new ExploreRecorder(setTake, {
        recentGroups: 32,
        onWrite: (notes) => library.capture(notes),
      }),
  );
  const [recordingsOpen, setRecordingsOpen] = useState(false);
  const [afterGroup, setAfterGroup] = useState(0);
  const [playback, setPlayback] = useState(emptyPlayback);
  const [player] = useState(() => new RecordingPlayer(setPlayback, sound));
  const displayedTake = playback.playing ? playback.notes : take;
  useEffect(() => {
    void library.init(recorder);
    const save = () => {
      recorder.releaseAll(performance.now());
      void library.flush();
    };
    const hidden = () => {
      if (document.hidden) save();
    };
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', hidden);
      library.dispose();
    };
  }, [library, recorder]);
  useEffect(() => {
    if (!freePlay) player.stop();
  }, [freePlay, player]);
  return {
    libraryState,
    library,
    recorder,
    recordingsOpen,
    setRecordingsOpen,
    afterGroup,
    setAfterGroup,
    playback,
    player,
    displayedTake,
  };
}
