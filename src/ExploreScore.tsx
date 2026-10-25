import { useEffect, useMemo, useRef, useState } from 'react';
import type Vex from 'vexflow';
import styles from './ExploreScore.module.css';
import type { PlayedNote } from './explore';
import { liveGrid, livePage } from './live-score';
import { noteName, octave } from './music';
import scoreStyles from './Score.module.css';
import type { ScoreSize } from './view';

type Flow = typeof Vex.Flow;
type Drawing = {
  flow: Flow;
  context: Vex.IRenderContext;
  staves: Vex.Flow.Stave[][];
  svg: SVGSVGElement;
  notes?: Element;
};

export function ExploreScore({
  notes,
  multiline,
  size,
  afterGroup = 0,
}: {
  notes: PlayedNote[];
  multiline: boolean;
  size: ScoreSize;
  afterGroup?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const drawing = useRef<Drawing | null>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [ready, setReady] = useState(0);
  const [error, setError] = useState('');
  const grid = useMemo(
    () => liveGrid(bounds.width, bounds.height, multiline, size),
    [bounds.width, bounds.height, multiline, size],
  );
  const page = useMemo(
    () => livePage(notes, grid.capacity, afterGroup),
    [notes, grid.capacity, afterGroup],
  );
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const resize = () =>
      setBounds({ width: element.clientWidth, height: element.clientHeight });
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let disposed = false;
    async function setup() {
      try {
        const { default: Vex } = await import('vexflow');
        if (disposed || !host.current) return;
        const flow = Vex.Flow;
        host.current.replaceChildren();
        const renderer = new flow.Renderer(
          host.current,
          flow.Renderer.Backends.SVG,
        );
        renderer.resize(grid.width, grid.height);
        const context = renderer.getContext();
        const staves: Vex.Flow.Stave[][] = [];
        for (let row = 0; row < grid.rows; row++)
          for (let column = 0; column < grid.columns; column++) {
            const measure = row * grid.columns + column;
            const pair = ['treble', 'bass'].map((clef, staff) => {
              const stave = new flow.Stave(
                column * 320 + 4,
                row * 240 + (staff === 0 ? 20 : 120),
                312,
              );
              if (column === 0) stave.addClef(clef).addTimeSignature('4/4');
              stave.setContext(context).draw();
              return stave;
            });
            staves[measure] = pair;
          }
        const svg = host.current.querySelector('svg')!;
        svg.setAttribute('viewBox', `0 0 ${grid.width} ${grid.height}`);
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.setAttribute('preserveAspectRatio', 'xMidYMin meet');
        drawing.current = { flow, context, staves, svg };
        setReady((value) => value + 1);
        setError('');
      } catch {
        if (!disposed)
          setError(
            'The live staff could not load. Your recording can still be saved.',
          );
      }
    }
    void setup();
    return () => {
      disposed = true;
      drawing.current = null;
    };
  }, [grid.width, grid.height, grid.columns, grid.rows]);
  useEffect(() => {
    const d = drawing.current;
    if (!d) return;
    d.notes?.remove();
    const group = d.context.openGroup('explore-notes') as Element | undefined;
    for (const entry of page.groups) {
      const measure = Math.floor(entry.slot / 4),
        beat = entry.slot % 4;
      const staves = d.staves[measure];
      if (!staves) continue;
      for (const staff of [0, 1]) {
        const pitches = entry.notes
          .filter((note) => (note.midi < 60 ? 1 : 0) === staff)
          .sort((a, b) => a.midi - b.midi);
        // Silent hands/beats stay blank; never draw placeholder rests.
        if (!pitches.length) continue;
        // Keep even extreme MIDI notes inside the fixed staff. The octave label
        // makes octave displacement explicit instead of moving the layout.
        const keys = pitches.map((note) => {
          let pitch = note.midi;
          while (pitch < 36) pitch += 12;
          while (pitch > 96) pitch -= 12;
          return `${noteName(pitch).replace('♯', '#').toLowerCase()}/${octave(pitch)}`;
        });
        const glyph = new d.flow.StaveNote({
          clef: staff === 0 ? 'treble' : 'bass',
          keys,
          duration: 'q',
          auto_stem: true,
        });
        keys.forEach((key, index) => {
          if (key.includes('#'))
            glyph.addAccidental(index, new d.flow.Accidental('#'));
        });
        glyph.setStave(staves[staff]);
        const tick = new d.flow.TickContext().addTickable(glyph).preFormat();
        // Reserve the same space for clefs/signature in every measure.
        tick.setX(
          (measure % grid.columns) * 320 +
            110 +
            beat * 47 -
            glyph.getAbsoluteX(),
        );
        const latest = entry === page.groups.at(-1);
        if (latest)
          glyph.setStyle({ fillStyle: '#198559', strokeStyle: '#198559' });
        const noteGroup = d.context.openGroup(
          'live-note',
          `live-${entry.id}-${staff}`,
        ) as Element | undefined;
        glyph.setContext(d.context);
        glyph.draw();
        d.context.closeGroup();
        noteGroup?.setAttribute('data-slot', String(entry.slot));
        if (latest)
          noteGroup
            ?.querySelectorAll('.vf-notehead')
            .forEach((head) => head.classList.add(styles['live-hit']));
        pitches.forEach((note) => {
          if (note.midi < 36 || note.midi > 96) {
            const label = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'text',
            );
            label.setAttribute(
              'x',
              String((measure % grid.columns) * 320 + 120 + beat * 47),
            );
            label.setAttribute(
              'y',
              String(
                Math.floor(measure / grid.columns) * 240 +
                  (staff === 0 ? 10 : 238),
              ),
            );
            label.setAttribute('font-size', '11');
            label.textContent = `${noteName(note.midi)}${octave(note.midi)} ${note.midi > 96 ? '↑' : '↓'}`;
            noteGroup?.append(label);
          }
        });
      }
    }
    d.context.closeGroup();
    d.notes = group;
  }, [page, ready, grid.columns]);
  return (
    <div
      className={scoreStyles['score'] + ' ' + styles['explore-score']}
      role="img"
      aria-label="Live sheet music of what you played."
      data-page-start={page.start}
      data-measures={grid.columns * grid.rows}
    >
      {error && <p role="alert">{error}</p>}
      <div ref={host} className={styles['explore-drawing']} />
    </div>
  );
}
