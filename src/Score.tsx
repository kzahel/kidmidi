import type { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { useEffect, useRef, useState } from 'react';
import type { NoteHit } from './feedback';
import { musicXml, type Note, noteName, octave, type Song } from './music';
import { paintPlayedNote } from './paint-played-note';
import type { ScoreAttempt } from './played-note';
import styles from './Score.module.css';
import { fitScore, type ScoreSize, scoreZoom } from './view';

type CursorState = {
  active: number;
  complete: boolean;
  hit: NoteHit | null;
  hint: boolean;
  attempt: ScoreAttempt | null;
  fifths: number;
};

function paintCursor(
  instance: OpenSheetMusicDisplay,
  state: CursorState,
  root: HTMLElement,
) {
  const cursor = instance.cursor;
  if (!cursor) return;
  for (const previous of root.querySelectorAll('[data-played-note]'))
    previous.remove();
  if (state.attempt) {
    cursor.reset();
    for (let i = 0; i < state.attempt.index; i++) cursor.next();
    const target = cursor
      .GNotesUnderCursor()
      .find((note) => !note.sourceNote.isRest());
    if (target)
      paintPlayedNote(
        target,
        state.attempt,
        state.fifths,
        styles['played-note'],
      );
  }
  cursor.reset();
  for (let i = 0; i < state.active; i++) cursor.next();
  if (state.complete || (!state.hit && !state.hint)) cursor.hide();
  else cursor.show();
  const heads =
    state.hit || state.hint
      ? cursor.GNotesUnderCursor().flatMap((note) => {
          if (note.sourceNote.isRest()) return [];
          const graphic = note as typeof note & {
            getNoteheadSVGs?: () => HTMLElement[];
          };
          return graphic.getNoteheadSVGs?.() ?? [];
        })
      : [];
  for (const previous of root.querySelectorAll<HTMLElement>(
    `.${styles['hint-notehead']}`,
  )) {
    if (state.hint && !state.hit && heads.includes(previous)) continue;
    previous.classList.remove(styles['hint-notehead']);
  }
  for (const previous of root.querySelectorAll<HTMLElement>(
    `.${styles['hit-notehead']}`,
  )) {
    if (state.hit && heads.includes(previous)) continue;
    previous.classList.remove(styles['hit-notehead'], styles['hit-held']);
    delete previous.dataset.hitId;
  }
  for (const head of heads) {
    if (!state.hit) {
      head.classList.add(styles['hint-notehead']);
      continue;
    }
    if (head.dataset.hitId !== String(state.hit?.id)) {
      head.classList.remove(styles['hit-notehead']);
      void head.getBoundingClientRect();
      head.dataset.hitId = String(state.hit?.id);
    }
    head.classList.add(styles['hit-notehead']);
    head.classList.toggle(styles['hit-held'], !state.hit?.released);
  }
}

export function Score({
  notes,
  active,
  complete,
  song,
  wholeSong = false,
  phraseIndex = 0,
  endPhrase,
  hit,
  hint,
  attempt = null,
  size,
  scoreXml,
  flashcard = false,
  onReady,
}: {
  notes: Note[];
  active: number;
  complete: boolean;
  song: Song;
  wholeSong?: boolean;
  phraseIndex?: number;
  endPhrase?: number;
  hit: NoteHit | null;
  hint: boolean;
  attempt?: ScoreAttempt | null;
  size: ScoreSize;
  scoreXml?: string;
  flashcard?: boolean;
  onReady?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const renderer = useRef<OpenSheetMusicDisplay | null>(null);
  const latest = useRef({
    active,
    complete,
    hit,
    hint,
    attempt,
    fifths: song.keyFifths ?? 0,
  });
  latest.current = {
    active,
    complete,
    hit,
    hint,
    attempt,
    fifths: song.keyFifths ?? 0,
  };
  const ready = useRef(onReady);
  ready.current = onReady;
  const [error, setError] = useState('');

  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    let resizeFrame = 0;
    let instance: OpenSheetMusicDisplay | undefined;
    setError('');
    const mount = document.createElement('div');
    host.current?.appendChild(mount);
    const viewport = host.current?.parentElement;
    const move = () => {
      if (instance) paintCursor(instance, latest.current, mount);
    };
    let previousWidth = 0;
    let previousHeight = 0;
    const layout = () => {
      if (disposed || !instance || !viewport) return;
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      if (width < 1 || height < 1) return;
      previousWidth = width;
      previousHeight = height;
      mount.style.transform = 'none';
      const baseWidth = Math.max(
        width,
        flashcard
          ? Math.max(240, notes.length * 180)
          : size === 'kid'
            ? 640
            : 480,
      );
      const availableWidth = Math.max(1, width - 4);
      const availableHeight = Math.max(1, height - 4);
      let best = { width: baseWidth, scale: 0, fittedWidth: 0 };
      let renderedWidth = 0;
      // A wider engraving can turn three cramped lines into one or two,
      // keeping the fitted noteheads larger on a short, wide screen.
      for (const factor of [1, 1.5, 2, 3]) {
        const candidateWidth = Math.round(baseWidth * factor);
        const upperBound = Math.min(1, availableWidth / candidateWidth);
        if (upperBound < best.scale) break;
        mount.style.width = `${candidateWidth}px`;
        instance.Zoom = flashcard ? 3 : scoreZoom[size];
        instance.render();
        renderedWidth = candidateWidth;
        const contentWidth = Math.max(candidateWidth, mount.scrollWidth);
        const fit = fitScore(
          contentWidth,
          mount.scrollHeight,
          availableWidth,
          availableHeight,
        );
        if (fit.scale > best.scale)
          best = {
            width: candidateWidth,
            scale: fit.scale,
            fittedWidth: fit.width,
          };
        if (fit.scale >= upperBound - 0.001) break;
      }
      if (renderedWidth !== best.width) {
        mount.style.width = `${best.width}px`;
        instance.render();
      }
      mount.style.transform = `scale(${best.scale})`;
      mount.style.left = `${Math.max(0, (width - best.fittedWidth) / 2)}px`;
      mount.style.top = '2px';
      viewport.dataset.fitScale = String(best.scale);
      move();
    };
    async function render() {
      try {
        const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay');
        if (disposed) return;
        instance = new OpenSheetMusicDisplay(mount, {
          backend: 'svg',
          autoResize: false,
          autoBeam: Boolean(scoreXml),
          drawCredits: false,
          drawTitle: false,
          drawSubtitle: false,
          drawLyricist: false,
          drawComposer: false,
          drawPartNames: false,
          drawMeasureNumbers: false,
          cursorsOptions: [
            { type: 0, color: '#71bfa4', alpha: 0.35, follow: false },
          ],
        });
        if (flashcard) instance.EngravingRules.RenderTimeSignatures = false;
        instance.EngravingRules.PageLeftMargin = scoreXml ? 3 : 1;
        instance.EngravingRules.PageRightMargin = 1;
        instance.EngravingRules.MinimumDistanceBetweenSystems = 3;
        instance.EngravingRules.MinSkyBottomDistBetweenSystems = 1;
        instance.EngravingRules.PageTopMargin = 0;
        instance.EngravingRules.PageTopMarginNarrow = 0;
        instance.EngravingRules.PageBottomMargin = 0;
        instance.EngravingRules.NewSystemAtXMLNewSystemAttribute = true;
        await instance.load(
          scoreXml ??
            musicXml(notes, {
              ...song,
              measuresPerSystem: wholeSong
                ? (song.measuresPerSystem ?? 2)
                : undefined,
              startMeasure:
                1 +
                song.phrases
                  .slice(0, phraseIndex)
                  .flat()
                  .reduce((sum, note) => sum + note.beats, 0) /
                  (song.timeSignature?.beats ?? 4),
              finalBarline:
                (endPhrase ?? phraseIndex + 1) >= song.phrases.length,
            }),
        );
        if (disposed) return;
        renderer.current = instance;
        layout();
        ready.current?.();
        observer = new ResizeObserver(() => {
          if (
            disposed ||
            !viewport ||
            (previousWidth === viewport.clientWidth &&
              previousHeight === viewport.clientHeight)
          )
            return;
          cancelAnimationFrame(resizeFrame);
          resizeFrame = requestAnimationFrame(layout);
        });
        if (viewport) observer.observe(viewport);
      } catch {
        if (!disposed)
          setError(
            'The staff could not load. You can still play using the note hint below.',
          );
      }
    }
    void render();
    return () => {
      disposed = true;
      observer?.disconnect();
      cancelAnimationFrame(resizeFrame);
      instance?.clear();
      mount.remove();
      renderer.current = null;
    };
  }, [
    notes,
    song,
    wholeSong,
    phraseIndex,
    endPhrase,
    size,
    scoreXml,
    flashcard,
  ]);

  useEffect(() => {
    if (renderer.current && host.current)
      paintCursor(renderer.current, latest.current, host.current);
  }, [active, complete, hit, hint, attempt, song.keyFifths]);

  return (
    <div
      className={
        styles['score'] +
        ' ' +
        (hit ? styles['hit-active'] : hint ? styles['hint-active'] : '')
      }
      role="img"
      aria-label={
        scoreXml
          ? 'Live sheet music of what you played.'
          : `Sheet music: ${notes.map((note) => note.midi).join(', ')}. ${attempt ? `A faint ${noteName(attempt.midi)}${octave(attempt.midi)} shows what you played at the waiting ${noteName(attempt.target)}${octave(attempt.target)}. Try a little ${attempt.midi < attempt.target ? 'higher' : 'lower'}.` : ''} ${hit ? 'The note you played is highlighted.' : hint ? 'A faint cursor hints at the next note.' : 'Waiting for you to play.'}`
      }
    >
      {error && <p role="alert">{error}</p>}
      <div className={styles['score-host']} ref={host} />
    </div>
  );
}
