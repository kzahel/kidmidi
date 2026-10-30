import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CompanionDance, type Dance } from './companion-dance';
import { IdleHint, NoteFeedback, type NoteHit } from './feedback';
import { displayKeyRange, keyboardLayout, screenKeyboard } from './keyboard';
import { advance, type NoteEvent, songs, startPosition } from './music';
import { PhrasePreview, type PreviewState } from './phrase-preview';
import { SoundOutput } from './sound-output';
import { loadSoundSettings, saveSoundSettings } from './sound-settings';
import { useExploreSession } from './useExploreSession';
import type { HuntController } from './useHuntSession';
import { useKeyboard } from './useKeyboard';
import { useMidi } from './useMidi';
import { loadViewSettings, practicePage, saveViewSettings } from './view';

const shortcuts: Record<string, number> = {
  a: 60,
  s: 62,
  d: 64,
  f: 65,
  g: 67,
  h: 69,
  j: 71,
  k: 72,
};

export type Activity =
  | 'home'
  | 'songs'
  | 'practice'
  | 'explore'
  | 'hunt'
  | 'path';

export function usePianoSession(
  mode: Activity,
  huntSession: HuntController,
  blocked = false,
  audition = false,
) {
  const huntController = useRef(huntSession);
  huntController.current = huntSession;
  const [songId, setSongId] = useState(songs[0].id);
  const song = songs.find((candidate) => candidate.id === songId) ?? songs[0];
  const [position, setPosition] = useState(startPosition);
  const freePlay = mode === 'explore';
  const hunting = mode === 'hunt';
  const hunt = huntSession.state;
  const [soundSettings, setSoundSettings] = useState(loadSoundSettings);
  const [soundError, setSoundError] = useState('');
  const [sound] = useState(() => new SoundOutput(undefined, setSoundError));
  const [dance, setDance] = useState<Dance | null>(null);
  const [dancer] = useState(
    () =>
      new CompanionDance(setDance, {
        now: () => performance.now(),
        schedule: (callback, delay) => window.setTimeout(callback, delay),
        cancel: (timer) => window.clearTimeout(timer),
      }),
  );
  const explore = useExploreSession(freePlay, sound);
  const {
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
  } = explore;
  const [view, setView] = useState(loadViewSettings);
  const wholeSong = view.multiline;
  const [screen, setScreen] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const [requestedPage, setRequestedPage] = useState<number | null>(null);
  useEffect(() => {
    const update = () =>
      setScreen({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [hints, setHints] = useState(true);
  const [pressed, setPressed] = useState(new Set<number>());
  const [lastNote, setLastNote] = useState<number | null>(null);
  const [hit, setHit] = useState<NoteHit | null>(null);
  const [hintReady, setHintReady] = useState(false);
  const [idleHint] = useState(
    () =>
      new IdleHint(setHintReady, {
        now: () => performance.now(),
        schedule: (callback, delay) => window.setTimeout(callback, delay),
        cancel: (timer) => window.clearTimeout(timer),
      }),
  );
  const [feedback] = useState(
    () =>
      new NoteFeedback(setHit, {
        now: () => performance.now(),
        schedule: (callback, delay) => window.setTimeout(callback, delay),
        cancel: (timer) => window.clearTimeout(timer),
      }),
  );
  const [previewState, setPreviewState] = useState<PreviewState>({
    playing: false,
    error: '',
  });
  const [preview] = useState(
    () => new PhrasePreview(setPreviewState, sound.speaker),
  );
  const held = useRef(new Map<string, number>());
  const active = mode === 'practice';
  const current = useRef({
    song,
    position,
    freePlay,
    hunting,
    active,
    blocked,
    audition,
  });
  current.current = {
    song,
    position,
    freePlay,
    hunting,
    active,
    blocked,
    audition,
  };

  const releaseAll = useCallback(() => {
    dancer.reset();
    player.stop();
    preview.stop();
    held.current.clear();
    setPressed(new Set());
    sound.stopAll();
    feedback.cancel();
    recorder.releaseAll(performance.now());
  }, [dancer, feedback, recorder, player, preview, sound]);
  const play = useCallback(
    (event: NoteEvent, source: string) => {
      const id = `${source}:${event.channel}:${event.note}`;
      const atMs = event.atMs ?? performance.now();
      if (event.type === 'off') {
        held.current.delete(id);
        sound.stop(id);
        feedback.release(id);
        recorder.noteOff(id, atMs);
      } else {
        if (
          (current.current.blocked && !current.current.audition) ||
          (!current.current.active &&
            !current.current.freePlay &&
            !current.current.hunting &&
            !current.current.audition)
        )
          return;
        if (held.current.has(id)) return;
        const state = current.current;
        if (player.playing) player.stop();
        if (preview.playing) preview.stop();
        held.current.set(id, event.note);
        setLastNote(event.note);
        sound.play(
          id,
          event.note,
          undefined,
          undefined,
          event.velocity,
          source,
        );
        if (state.audition) {
          // Settings are a sound playground, never a performance or an attempt.
        } else if (state.hunting) {
          huntController.current.guess(event.note, source);
        } else if (state.freePlay) {
          recorder.noteOn(id, event.note, atMs, event.velocity);
          dancer.noteOn(event.note, atMs);
        } else if (state.active) {
          const next = advance(state.song, state.position, event.note);
          if (next !== state.position) {
            setRequestedPage(null);
            feedback.start(
              state.position,
              state.song.phrases[state.position.phrase][state.position.note],
              id,
            );
          }
          current.current = { ...state, position: next };
          setPosition(next);
        }
      }
      setPressed(new Set(held.current.values()));
    },
    [dancer, feedback, recorder, player, preview, sound],
  );
  const midi = useMidi((event) => {
    if (preview.midiPlaying && event.type === 'on') return;
    if (sound.isEcho(event)) return;
    if (event.type === 'on' && keyboard.observe(event.note)) return;
    play(event, 'midi');
  }, releaseAll);
  useEffect(() => {
    releaseAll();
  }, [midi.output, releaseAll]);
  useEffect(() => {
    sound.configure(soundSettings, midi.output);
    saveSoundSettings(soundSettings);
  }, [sound, soundSettings, midi.output]);
  const connected = midi.inputs.find((input) => input.id === midi.selected);
  const keyboard = useKeyboard(connected ?? screenKeyboard);
  const displayedRange = displayKeyRange(
    keyboard.range,
    keyboard.zoom,
    screen.width,
    screen.height,
  );
  const keyHeight =
    screen.height <= 500 ? 100 : view.size === 'kid' ? 158 : 136;
  const keyLayout = useMemo(
    () => keyboardLayout(displayedRange),
    [displayedRange.low, displayedRange.high],
  );

  useEffect(() => {
    idleHint.update(
      !hints ||
        blocked ||
        !active ||
        freePlay ||
        hunting ||
        Boolean(hit) ||
        position.complete ||
        pressed.size > 0 ||
        document.hidden,
    );
    return () => idleHint.dispose();
  }, [
    blocked,
    active,
    hints,
    freePlay,
    hunting,
    hit,
    position.complete,
    pressed,
    idleHint,
  ]);

  // Keep the matched card visible through a held key and a short celebration.
  useEffect(() => {
    if (blocked || !hunting || !hunt.found || pressed.size > 0) return;
    const timer = window.setTimeout(() => {
      huntController.current.next();
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [blocked, hunting, hunt, pressed]);

  useEffect(() => saveViewSettings(view), [view]);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (
        event.type === 'keydown' &&
        event.target instanceof HTMLElement &&
        (event.target.closest('input, select, textarea, dialog') ||
          event.target.isContentEditable)
      )
        return;
      const note = shortcuts[event.key.toLowerCase()];
      if (
        !note ||
        event.repeat ||
        (event.type === 'keydown' &&
          (event.altKey || event.metaKey || event.ctrlKey))
      )
        return;
      event.preventDefault();
      play(
        {
          type: event.type === 'keydown' ? 'on' : 'off',
          note,
          velocity: 90,
          channel: 0,
        },
        'computer',
      );
    };
    window.addEventListener('keydown', handle);
    window.addEventListener('keyup', handle);
    window.addEventListener('blur', releaseAll);
    const hidden = () => {
      if (document.hidden) releaseAll();
    };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('keydown', handle);
      window.removeEventListener('keyup', handle);
      window.removeEventListener('blur', releaseAll);
      document.removeEventListener('visibilitychange', hidden);
      dancer.dispose();
      feedback.dispose();
      sound.close();
      player.dispose();
      preview.dispose();
    };
  }, [dancer, play, releaseAll, feedback, player, preview, sound]);

  function hearPhrase() {
    releaseAll();
    const destination = sound.playbackDestinations;
    void preview.hear(
      pageNotes,
      destination.keyboard ? sound.midiOutput : undefined,
      destination.screen,
      soundSettings.route === 'quiet',
    );
  }

  function reset() {
    releaseAll();
    setPosition(startPosition());
    setLastNote(null);
    setRequestedPage(null);
    huntController.current.reset();
  }
  function clearTake() {
    releaseAll();
    library.newSession();
    recorder.clear();
    setAfterGroup(0);
    setLastNote(null);
  }
  function clearExplorePage() {
    releaseAll();
    recorder.breakGroup();
    setAfterGroup(recorder.nextGroup);
  }
  async function loadRecording(id: string) {
    releaseAll();
    if (id !== library.state.current?.id) recorder.load(await library.load(id));
    setAfterGroup(0);
    setLastNote(null);
  }
  async function readRecording(id: string) {
    if (id === library.state.current?.id) return recorder.getNotes();
    await library.flush();
    return library.read(id);
  }
  const shownPosition = hit?.position ?? position;
  const notes = song.phrases[shownPosition.phrase];
  const expected = notes[shownPosition.note].midi;
  const page = practicePage(
    song.phrases.length,
    shownPosition.phrase,
    view.multiline,
    view.size,
    screen.width,
    screen.height,
    view.multiline ? requestedPage : null,
  );
  const pageNotes = useMemo(
    () => song.phrases.slice(page.start, page.end).flat(),
    [song, page.start, page.end],
  );
  const pageContainsCurrent =
    shownPosition.phrase >= page.start && shownPosition.phrase < page.end;
  const pageOffset = song.phrases.slice(0, page.start).flat().length;
  const shownCount =
    song.phrases.slice(0, shownPosition.phrase).flat().length +
    shownPosition.note;
  const playedCount =
    song.phrases.slice(0, position.phrase).flat().length +
    position.note +
    (position.complete ? 1 : 0);
  const total = song.phrases.flat().length;
  const artBounds = song.source?.illustrationViewBox.split(' ').map(Number);

  return {
    songId,
    setSongId,
    song,
    freePlay,
    dance,
    hunting,
    hunt,
    huntSession,
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
    view,
    setView,
    wholeSong,
    setRequestedPage,
    rangeOpen,
    setRangeOpen,
    hints,
    setHints,
    pressed,
    lastNote,
    hit,
    hintReady,
    previewState,
    preview,
    hearPhrase,
    sound,
    soundSettings,
    setSoundSettings,
    soundError,
    releaseAll,
    play,
    midi,
    connected,
    keyboard,
    keyLayout,
    keyHeight,
    shownPosition,
    expected,
    page,
    pageNotes,
    pageContainsCurrent,
    pageOffset,
    shownCount,
    playedCount,
    total,
    artBounds,
    reset,
    clearTake,
    clearExplorePage,
    loadRecording,
    readRecording,
  };
}

export type PianoSession = ReturnType<typeof usePianoSession>;
