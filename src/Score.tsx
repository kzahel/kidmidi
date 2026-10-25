import type { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { useEffect, useRef, useState } from 'react';
import type { NoteHit } from './feedback';
import { musicXml, type Note, type Song } from './music';
import { type ScoreSize, scoreZoom } from './view';

type CursorState = {
  active: number;
  complete: boolean;
  hit: NoteHit | null;
  hint: boolean;
};

function paintCursor(
  instance: OpenSheetMusicDisplay,
  state: CursorState,
  root: HTMLElement,
) {
  const cursor = instance.cursor;
  if (!cursor) return;
  cursor.reset();
  for (let i = 0; i < state.active; i++) cursor.next();
  if (state.complete || (!state.hit && !state.hint)) cursor.hide();
  else cursor.show();
  const heads =
    state.hit || state.hint
      ? cursor.GNotesUnderCursor().flatMap((note) => {
          const graphic = note as typeof note & {
            getNoteheadSVGs?: () => HTMLElement[];
          };
          return graphic.getNoteheadSVGs?.() ?? [];
        })
      : [];
  for (const previous of root.querySelectorAll<HTMLElement>('.hint-notehead')) {
    if (state.hint && !state.hit && heads.includes(previous)) continue;
    previous.classList.remove('hint-notehead');
  }
  for (const previous of root.querySelectorAll<HTMLElement>('.hit-notehead')) {
    if (state.hit && heads.includes(previous)) continue;
    previous.classList.remove('hit-notehead', 'hit-held');
    delete previous.dataset.hitId;
  }
  for (const head of heads) {
    if (!state.hit) {
      head.classList.add('hint-notehead');
      continue;
    }
    if (head.dataset.hitId !== String(state.hit?.id)) {
      head.classList.remove('hit-notehead');
      void head.getBoundingClientRect();
      head.dataset.hitId = String(state.hit?.id);
    }
    head.classList.add('hit-notehead');
    head.classList.toggle('hit-held', !state.hit?.released);
  }
  const viewport = root.closest<HTMLElement>('.score');
  if (viewport && (state.hit || state.hint) && !state.complete) {
    const marker = cursor.cursorElement.getBoundingClientRect();
    const bounds = viewport.getBoundingClientRect();
    if (marker.left < bounds.left + 12 || marker.right > bounds.right - 12) {
      viewport.scrollLeft +=
        marker.left - bounds.left - viewport.clientWidth * 0.35;
    }
    if (marker.top < bounds.top + 12 || marker.bottom > bounds.bottom - 12) {
      viewport.scrollTop +=
        marker.top - bounds.top - viewport.clientHeight * 0.35;
    }
  }
}

export function Score({
  notes,
  active,
  complete,
  song,
  wholeSong = false,
  phraseIndex = 0,
  hit,
  hint,
  size,
}: {
  notes: Note[];
  active: number;
  complete: boolean;
  song: Song;
  wholeSong?: boolean;
  phraseIndex?: number;
  hit: NoteHit | null;
  hint: boolean;
  size: ScoreSize;
}) {
  const host = useRef<HTMLDivElement>(null);
  const renderer = useRef<OpenSheetMusicDisplay | null>(null);
  const latest = useRef({ active, complete, hit, hint });
  latest.current = { active, complete, hit, hint };
  const [error, setError] = useState('');

  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    let instance: OpenSheetMusicDisplay | undefined;
    setError('');
    const mount = document.createElement('div');
    host.current?.appendChild(mount);
    const move = () => {
      if (instance) paintCursor(instance, latest.current, mount);
    };
    async function render() {
      try {
        const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay');
        if (disposed) return;
        instance = new OpenSheetMusicDisplay(mount, {
          backend: 'svg',
          autoResize: false,
          autoBeam: false,
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
        instance.EngravingRules.PageLeftMargin = 1;
        instance.EngravingRules.PageRightMargin = 1;
        instance.EngravingRules.MinimumDistanceBetweenSystems = 3;
        instance.EngravingRules.MinSkyBottomDistBetweenSystems = 1;
        instance.EngravingRules.PageTopMargin = 0;
        instance.EngravingRules.PageTopMarginNarrow = 0;
        instance.EngravingRules.PageBottomMargin = 0;
        instance.EngravingRules.NewSystemAtXMLNewSystemAttribute = true;
        await instance.load(
          musicXml(notes, {
            ...song,
            measuresPerSystem: wholeSong
              ? (song.measuresPerSystem ?? 2)
              : undefined,
            startMeasure: wholeSong
              ? 1
              : 1 +
                song.phrases
                  .slice(0, phraseIndex)
                  .flat()
                  .reduce((sum, note) => sum + note.beats, 0) /
                  (song.timeSignature?.beats ?? 4),
            finalBarline: wholeSong || phraseIndex === song.phrases.length - 1,
          }),
        );
        if (disposed) return;
        instance.Zoom = scoreZoom[size];
        instance.render();
        renderer.current = instance;
        move();
        let previousWidth = mount.clientWidth;
        observer = new ResizeObserver(() => {
          if (disposed || !instance || previousWidth === mount.clientWidth)
            return;
          previousWidth = mount.clientWidth;
          instance.render();
          move();
        });
        observer.observe(mount);
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
      instance?.clear();
      mount.remove();
      renderer.current = null;
    };
  }, [notes, song, wholeSong, phraseIndex, size]);

  useEffect(() => {
    if (renderer.current && host.current)
      paintCursor(renderer.current, latest.current, host.current);
  }, [active, complete, hit, hint]);

  return (
    <div
      className={`score ${hit ? 'hit-active' : hint ? 'hint-active' : ''} ${wholeSong ? 'multiline' : ''}`}
      role="img"
      aria-label={`Sheet music: ${notes.map((note) => note.midi).join(', ')}. ${hit ? 'The note you played is highlighted.' : hint ? 'A faint cursor hints at the next note.' : 'Waiting for you to play.'}`}
    >
      {error && <p role="alert">{error}</p>}
      <div ref={host} />
    </div>
  );
}
