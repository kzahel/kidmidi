import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { assetUrl } from './assets';
import { PianoAudio } from './audio';
import { ExploreScore } from './ExploreScore';
import { ExploreRecorder, type PlayedNote } from './explore';
import { IdleHint, NoteFeedback, type NoteHit } from './feedback';
import { guessHunt, nextHunt, startHunt } from './hunt';
import { keyboardLayout, screenKeyboard } from './keyboard';
import {
  advance,
  type NoteEvent,
  noteName,
  octave,
  songs,
  startPosition,
} from './music';
import { NoteHunt } from './NoteHunt';
import { PhrasePreview, type PreviewState } from './phrase-preview';
import { emptyPlayback, RecordingPlayer } from './playback';
import { downloadMusicXml, RecordingMenu } from './RecordingMenu';
import { emptyLibrary, RecordingLibrary } from './recordings';
import { Score } from './Score';
import { useKeyboard } from './useKeyboard';
import { useMidi } from './useMidi';
import {
  loadViewSettings,
  practicePage,
  type ScoreSize,
  saveViewSettings,
} from './view';

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

export function App() {
  const [songId, setSongId] = useState(songs[0].id);
  const song = songs.find((candidate) => candidate.id === songId) ?? songs[0];
  const [position, setPosition] = useState(startPosition);
  const [mode, setMode] = useState<'practice' | 'explore' | 'hunt'>('practice');
  const freePlay = mode === 'explore';
  const hunting = mode === 'hunt';
  const [hunt, setHunt] = useState(startHunt);
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
  const [player] = useState(() => new RecordingPlayer(setPlayback));
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
  const [preview] = useState(() => new PhrasePreview(setPreviewState));
  const held = useRef(new Map<string, number>());
  const audio = useRef(new PianoAudio());
  const current = useRef({ song, position, freePlay, hunting, hunt });
  current.current = { song, position, freePlay, hunting, hunt };

  const releaseAll = useCallback(() => {
    player.stop();
    preview.stop();
    held.current.clear();
    setPressed(new Set());
    audio.current.stopAll();
    feedback.cancel();
    recorder.releaseAll(performance.now());
  }, [feedback, recorder, player, preview]);
  const play = useCallback(
    (event: NoteEvent, source: string) => {
      const id = `${source}:${event.channel}:${event.note}`;
      const atMs = event.atMs ?? performance.now();
      if (event.type === 'off') {
        held.current.delete(id);
        audio.current.stop(id);
        feedback.release(id);
        recorder.noteOff(id, atMs);
      } else {
        if (held.current.has(id)) return;
        held.current.set(id, event.note);
        setLastNote(event.note);
        if (source !== 'midi') audio.current.play(id, event.note);
        const state = current.current;
        if (state.freePlay && player.playing) player.stop();
        if (state.hunting) {
          const next = guessHunt(state.hunt, event.note);
          current.current = { ...state, hunt: next };
          setHunt(next);
        } else if (state.freePlay) {
          recorder.noteOn(id, event.note, atMs, event.velocity);
        } else {
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
    [feedback, recorder, player],
  );
  const midi = useMidi((event) => {
    if (preview.midiPlaying && event.type === 'on') return;
    if (event.type === 'on' && keyboard.observe(event.note)) return;
    play(event, 'midi');
  }, releaseAll);
  useEffect(() => {
    preview.stop();
    return () => preview.stop();
  }, [midi.output, preview]);
  const connected = midi.inputs.find((input) => input.id === midi.selected);
  const keyboard = useKeyboard(connected ?? screenKeyboard);
  const keyLayout = useMemo(
    () => keyboardLayout(keyboard.displayRange),
    [keyboard.displayRange.low, keyboard.displayRange.high],
  );

  useEffect(() => {
    idleHint.update(
      !hints ||
        freePlay ||
        hunting ||
        Boolean(hit) ||
        position.complete ||
        pressed.size > 0 ||
        document.hidden,
    );
    return () => idleHint.dispose();
  }, [hints, freePlay, hunting, hit, position.complete, pressed, idleHint]);

  // Keep the matched card visible through a held key and a short celebration.
  useEffect(() => {
    if (!hunting || !hunt.found || pressed.size > 0) return;
    const timer = window.setTimeout(() => {
      const next = nextHunt(current.current.hunt);
      current.current = { ...current.current, hunt: next };
      setHunt(next);
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [hunting, hunt, pressed]);

  useEffect(() => saveViewSettings(view), [view]);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (
        event.type === 'keydown' &&
        event.target instanceof HTMLElement &&
        (event.target.closest('input, select, textarea') ||
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
      feedback.dispose();
      audio.current.close();
      player.dispose();
      preview.dispose();
    };
  }, [play, releaseAll, feedback, player, preview]);

  function reset() {
    releaseAll();
    setPosition(startPosition());
    setLastNote(null);
    setRequestedPage(null);
    const next = startHunt(hunt.level);
    current.current = { ...current.current, hunt: next };
    setHunt(next);
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

  return (
    <main className={`app ${view.size}-view`}>
      <div className="toolbar">
        <nav className="song-picker" aria-label="Choose what to play">
          {songs.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`song-button ${mode === 'practice' && songId === item.id ? 'selected' : ''}`}
              aria-pressed={mode === 'practice' && songId === item.id}
              onClick={() => {
                reset();
                setSongId(item.id);
                setMode('practice');
              }}
            >
              {item.title}
            </button>
          ))}
          <button
            type="button"
            className={`song-button ${freePlay ? 'selected' : ''}`}
            aria-pressed={freePlay}
            onClick={() => {
              reset();
              setMode('explore');
            }}
          >
            Just explore
          </button>
          <button
            type="button"
            className={`song-button ${hunting ? 'selected' : ''}`}
            aria-pressed={hunting}
            onClick={() => {
              reset();
              setMode('hunt');
            }}
          >
            Note hunt
          </button>
        </nav>
        <select
          className="song-select"
          aria-label="Song"
          value={mode === 'practice' ? songId : mode}
          onChange={(event) => {
            reset();
            const value = event.target.value;
            setMode(
              value === 'explore' || value === 'hunt' ? value : 'practice',
            );
            if (value !== 'explore' && value !== 'hunt') setSongId(value);
          }}
        >
          {songs.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
          <option value="explore">Just explore</option>
          <option value="hunt">Note hunt</option>
        </select>
        <section className="connection" aria-label="MIDI connection">
          {midi.inputs.length > 1 && (
            <select
              aria-label="MIDI input"
              value={midi.selected}
              onChange={(event) => midi.setSelected(event.target.value)}
            >
              {midi.inputs.map((input) => (
                <option key={input.id} value={input.id}>
                  {input.name || input.id}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            className={`connection-button ${connected ? 'connected' : ''}`}
            onClick={() => void midi.connect()}
            disabled={!midi.supported || midi.requesting}
            title={connected ? 'Refresh MIDI connection' : undefined}
          >
            {connected && (
              <span className="connection-dot" aria-hidden="true" />
            )}
            {midi.requesting
              ? 'Connecting…'
              : connected
                ? connected.name || 'MIDI connected'
                : 'Connect keyboard'}
          </button>
        </section>
      </div>
      {(!midi.supported || (!connected && midi.status)) && (
        <p className="midi-status" role="status">
          {midi.supported
            ? midi.status
            : 'MIDI needs Chrome and HTTPS or localhost.'}
        </p>
      )}
      {hunting ? (
        <NoteHunt
          state={hunt}
          onReset={reset}
          onLevel={(level) => {
            releaseAll();
            const next = startHunt(level);
            current.current = { ...current.current, hunt: next };
            setHunt(next);
          }}
        />
      ) : (
        <section className="practice" aria-label="Piano practice">
          <div className="practice-controls">
            {freePlay ? (
              <span className="phrase-count">{recorder.count} notes · 4/4</span>
            ) : (
              <>
                <span className="phrase-count">
                  Phrase {shownPosition.phrase + 1} of {song.phrases.length}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (previewState.playing) preview.stop();
                    else {
                      void preview.hear(pageNotes, midi.output);
                    }
                  }}
                >
                  <span aria-hidden="true">
                    {previewState.playing ? '◼' : '▷'}
                  </span>{' '}
                  {previewState.playing ? 'Stop preview' : 'Hear this phrase'}
                </button>
                {(midi.outputs.length > 0 || midi.outputChoice !== 'auto') && (
                  <select
                    aria-label="Phrase sound"
                    value={midi.outputChoice}
                    title="Phrase playback sound"
                    onChange={(event) => {
                      preview.stop();
                      midi.setOutput(event.target.value);
                    }}
                  >
                    <option value="auto">
                      Auto · {midi.automaticOutput?.name || 'Speakers'}
                    </option>
                    <option value="speakers">Speakers</option>
                    {midi.outputs.map((output) => (
                      <option key={output.id} value={output.id}>
                        {output.name || output.id}
                      </option>
                    ))}
                    {!['auto', 'speakers'].includes(midi.outputChoice) &&
                      !midi.outputs.some(
                        (output) => output.id === midi.outputChoice,
                      ) && (
                        <option value={midi.outputChoice}>
                          Saved output unavailable ·{' '}
                          {midi.output?.name || 'Speakers'}
                        </option>
                      )}
                  </select>
                )}
                {previewState.error && (
                  <span className="preview-status" role="status">
                    {previewState.error}
                  </span>
                )}
              </>
            )}
            <select
              aria-label="Score size"
              value={view.size}
              onChange={(event) =>
                setView((previous) => ({
                  ...previous,
                  size: event.target.value as ScoreSize,
                }))
              }
            >
              <option value="compact">Compact</option>
              <option value="kid">Kid</option>
            </select>
            <label className="hint-toggle">
              <input
                type="checkbox"
                checked={view.multiline}
                onChange={(event) =>
                  setView((previous) => ({
                    ...previous,
                    multiline: event.target.checked,
                  }))
                }
              />
              Multiline
            </label>
            {!freePlay && view.multiline && page.count > 1 && (
              <span className="page-controls" aria-label="Score pages">
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
            {!freePlay && song.source && (
              <a
                className="source-link"
                href={assetUrl(song.source.image)}
                target="_blank"
                rel="noreferrer"
              >
                Book photo ↗
              </a>
            )}
            {!freePlay && (
              <label className="hint-toggle">
                <input
                  type="checkbox"
                  checked={hints}
                  onChange={(event) => setHints(event.target.checked)}
                />
                Idle hints
              </label>
            )}
            {freePlay && (
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
                <span className="save-status" role="status">
                  {libraryState.status === 'saving'
                    ? 'Saving…'
                    : libraryState.status === 'saved'
                      ? 'Saved'
                      : libraryState.status === 'error'
                        ? 'Save failed'
                        : '\u00a0'}
                </span>
                <button
                  type="button"
                  disabled={!recorder.count}
                  onClick={() => downloadMusicXml(recorder.getNotes())}
                >
                  MusicXML ↓
                </button>
                <button type="button" onClick={clearExplorePage}>
                  Clear page
                </button>
                {playback.playing && (
                  <button type="button" onClick={() => player.stop()}>
                    Stop playback
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              className="restart"
              onClick={freePlay ? clearTake : reset}
              aria-label={freePlay ? 'New recording' : 'Start again'}
              title={freePlay ? 'New recording' : 'Start again'}
            >
              ↺
            </button>
          </div>
          {freePlay && (
            <>
              <ExploreScore
                notes={displayedTake}
                multiline={view.multiline}
                size={view.size}
                afterGroup={playback.playing ? 0 : afterGroup}
              />
              {libraryState.error && (
                <p className="recording-save-error" role="alert">
                  {libraryState.error}
                </p>
              )}
            </>
          )}
          {!freePlay && (
            <>
              <div
                className={`score-layout ${song.source ? 'illustrated' : ''}`}
              >
                <Score
                  notes={pageNotes}
                  active={Math.max(0, shownCount - pageOffset)}
                  complete={shownPosition.complete}
                  song={song}
                  wholeSong={wholeSong}
                  phraseIndex={page.start}
                  endPhrase={page.end}
                  hit={pageContainsCurrent ? hit : null}
                  hint={pageContainsCurrent && hintReady}
                  size={view.size}
                />
                {song.source && (
                  <svg
                    className="book-illustration"
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
                <div className="score-credit">
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
                className="progress-track"
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
          <div
            className={`play-status ${hit ? 'has-hit' : hintReady ? 'has-hint' : ''}`}
          >
            <span aria-live="polite">
              {freePlay ? (
                lastNote === null ? (
                  '—'
                ) : (
                  `You played ${noteName(lastNote)}${octave(lastNote)}`
                )
              ) : hit ? (
                <span className="hit-badge">
                  {noteName(hit.midi)}
                  {octave(hit.midi)} ✓
                  <span className="hit-duration" aria-hidden="true">
                    <i
                      key={hit.id}
                      style={{ animationDuration: `${hit.durationMs}ms` }}
                    />
                  </span>
                </span>
              ) : shownPosition.complete ? (
                'You played the whole song!'
              ) : hintReady ? (
                `Find ${noteName(expected)}${expected === 60 ? ' · middle C' : ` · octave ${octave(expected)}`}`
              ) : (
                '\u00a0'
              )}
            </span>
            {shownPosition.complete && !freePlay && (
              <button type="button" onClick={reset}>
                Play again
              </button>
            )}
            {lastNote !== null && !freePlay && (
              <span className="last-note">
                Played: {noteName(lastNote)}
                {octave(lastNote)}
              </span>
            )}
          </div>
        </section>
      )}
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
      <section className="keyboard-panel" aria-label="Live piano keyboard">
        <div className="keyboard-controls">
          <div className="keyboard-zoom" role="group" aria-label="Piano zoom">
            <button
              type="button"
              aria-pressed={keyboard.zoom === 'close'}
              onClick={() => keyboard.setZoom('close')}
            >
              Close · middle C
            </button>
            <button
              type="button"
              aria-pressed={keyboard.zoom === 'all'}
              onClick={() => keyboard.setZoom('all')}
            >
              All {keyboard.range.high - keyboard.range.low + 1} keys
            </button>
          </div>
          <button
            type="button"
            className="keyboard-range-button"
            aria-label="Set keyboard range"
            aria-expanded={rangeOpen}
            onClick={() => {
              if (rangeOpen) keyboard.cancelLearning();
              setRangeOpen(!rangeOpen);
            }}
          >
            Range ⚙
          </button>
        </div>
        {rangeOpen && (
          <div
            className="keyboard-range-setup"
            aria-label="Keyboard range setup"
          >
            <select
              aria-label="Keyboard range"
              value={`${keyboard.range.low}:${keyboard.range.high}`}
              onChange={(event) => {
                const [low, high] = event.target.value.split(':').map(Number);
                keyboard.setRange({ low, high });
              }}
            >
              <option value="36:96">61 keys · C2–C7</option>
              <option value="21:108">88 keys · A0–C8</option>
              {!['36:96', '21:108'].includes(
                `${keyboard.range.low}:${keyboard.range.high}`,
              ) && (
                <option value={`${keyboard.range.low}:${keyboard.range.high}`}>
                  {noteName(keyboard.range.low)}
                  {octave(keyboard.range.low)}–{noteName(keyboard.range.high)}
                  {octave(keyboard.range.high)}
                </option>
              )}
            </select>
            {keyboard.calibrating ? (
              <>
                <span className="keyboard-range-instruction" role="status">
                  {keyboard.rangeError ||
                    (keyboard.learningLow === null
                      ? 'Play the lowest key'
                      : 'Now play the highest key')}
                </span>
                <button type="button" onClick={keyboard.cancelLearning}>
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={!connected}
                onClick={() => {
                  releaseAll();
                  keyboard.startLearning();
                }}
              >
                Play end keys to set range
              </button>
            )}
          </div>
        )}
        <div className="keyboard-scroll">
          <div
            className={`keyboard ${keyboard.zoom === 'all' ? 'all-keys' : ''}`}
            style={
              {
                '--key-units': keyLayout.units,
                '--keyboard-ratio':
                  (keyLayout.units * (view.size === 'kid' ? 44 : 38) + 8) /
                  (view.size === 'kid' ? 158 : 136),
              } as React.CSSProperties
            }
          >
            {keyLayout.keys.map(({ note, black, left, width }) => {
              const active = pressed.has(note) || playback.active.has(note);
              const keyHit = hunting
                ? null
                : freePlay
                  ? displayedTake.at(-1)
                  : hit;
              const hint =
                hintReady &&
                !freePlay &&
                !hunting &&
                !shownPosition.complete &&
                !hit &&
                note === expected;
              return (
                <button
                  type="button"
                  key={note}
                  className={`piano-key ${black ? 'black' : 'white'} ${active ? 'pressed' : ''} ${hint ? 'expected' : ''} ${freePlay || hunting ? (active ? 'hit' : '') : hit?.midi === note ? 'hit' : ''}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  aria-label={`Play ${noteName(note)}${octave(note)}`}
                  aria-pressed={active}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    play(
                      { type: 'on', note, velocity: 90, channel: 0 },
                      `pointer-${event.pointerId}`,
                    );
                  }}
                  onPointerUp={(event) =>
                    play(
                      { type: 'off', note, velocity: 0, channel: 0 },
                      `pointer-${event.pointerId}`,
                    )
                  }
                  onLostPointerCapture={(event) =>
                    play(
                      { type: 'off', note, velocity: 0, channel: 0 },
                      `pointer-${event.pointerId}`,
                    )
                  }
                  onPointerCancel={(event) =>
                    play(
                      { type: 'off', note, velocity: 0, channel: 0 },
                      `pointer-${event.pointerId}`,
                    )
                  }
                  onClick={(event) => {
                    if (event.detail === 0) {
                      play(
                        { type: 'on', note, velocity: 90, channel: 0 },
                        'accessible',
                      );
                      play(
                        { type: 'off', note, velocity: 0, channel: 0 },
                        'accessible',
                      );
                    }
                  }}
                >
                  {keyHit?.midi === note && (
                    <span
                      className="hit-spark"
                      key={keyHit.id}
                      aria-hidden="true"
                    >
                      ✦
                    </span>
                  )}
                  {!black && (
                    <span
                      className={`key-label ${note === 60 ? 'middle-c' : ''}`}
                    >
                      {noteName(note)}
                      {note % 12 === 0 && <small>{octave(note)}</small>}
                    </span>
                  )}
                  {hint && <i aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
