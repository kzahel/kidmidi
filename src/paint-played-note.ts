import type { GraphicalNote } from 'opensheetmusicdisplay';
import type Vex from 'vexflow';
import { noteName, octave } from './music';
import { ghostAccidental, ghostPitch, type ScoreAttempt } from './played-note';

const namespace = 'http://www.w3.org/2000/svg';

// Draw inside the engraved note's own SVG coordinate system. This follows OSMD's
// staff geometry and page scaling without reloading/re-spacing any song notes.
export function paintPlayedNote(
  note: GraphicalNote,
  attempt: ScoreAttempt,
  fifths: number,
  className: string,
) {
  const graphic = note as GraphicalNote & {
    getNoteheadSVGs?: () => HTMLElement[];
    vfnote?: [Vex.Flow.StemmableNote, number];
  };
  const head = graphic.getNoteheadSVGs?.()[0];
  const stave = graphic.vfnote?.[0].getStave();
  if (!(head instanceof SVGGraphicsElement) || !stave || !head.parentElement)
    return;
  const box = head.getBBox();
  const spacing = stave.getSpacingBetweenLines();
  const top = stave.getYForLine(0);
  const bottom = stave.getYForLine(4);
  const x = box.x + box.width / 2;
  const targetY = box.y + box.height / 2;
  const pitch = ghostPitch(
    attempt.midi,
    attempt.target,
    targetY,
    spacing,
    Math.max(spacing, top - spacing * 2),
    bottom + spacing * 2,
  );
  const group = document.createElementNS(namespace, 'g');
  group.setAttribute('class', className);
  group.setAttribute('data-played-note', '');
  group.setAttribute('data-midi', String(attempt.midi));
  group.setAttribute('data-target-index', String(attempt.index));
  group.setAttribute('data-displayed-midi', String(pitch.displayed));
  group.setAttribute('aria-hidden', 'true');
  const clone = head.cloneNode(true) as SVGGraphicsElement;
  for (const element of [clone, ...clone.querySelectorAll('*')]) {
    element.removeAttribute('id');
    element.removeAttribute('class');
    element.removeAttribute('style');
    element.removeAttribute('data-hit-id');
  }
  clone.setAttribute(
    'transform',
    `translate(0 ${pitch.y - targetY}) ${head.getAttribute('transform') ?? ''}`,
  );
  clone.setAttribute('data-ghost-head', '');
  group.appendChild(clone);
  function line(x1: number, y1: number, x2: number, y2: number) {
    const element = document.createElementNS(namespace, 'line');
    for (const [key, value] of Object.entries({ x1, y1, x2, y2 }))
      element.setAttribute(key, String(value));
    element.setAttribute('stroke-width', '1.2');
    group.appendChild(element);
  }
  for (let y = top - spacing; y >= pitch.y - spacing * 0.2; y -= spacing)
    line(x - box.width * 0.8, y, x + box.width * 0.8, y);
  for (let y = bottom + spacing; y <= pitch.y + spacing * 0.2; y += spacing)
    line(x - box.width * 0.8, y, x + box.width * 0.8, y);
  // The written notehead keeps the target's duration shape; an independent stem
  // points into the staff, away from adjacent lyrics and system decorations.
  const stemUp = pitch.y >= (top + bottom) / 2;
  const stemX = x + (stemUp ? box.width / 2 - 1 : -box.width / 2 + 1);
  line(stemX, pitch.y, stemX, pitch.y + (stemUp ? -1 : 1) * spacing * 3);
  function text(value: string, tx: number, ty: number, size: number) {
    const element = document.createElementNS(namespace, 'text');
    element.textContent = value;
    element.setAttribute('x', String(tx));
    element.setAttribute('y', String(ty));
    element.setAttribute('font-size', String(size));
    group.appendChild(element);
  }
  const accidental = ghostAccidental(attempt.midi, fifths);
  if (accidental)
    text(
      accidental,
      box.x - spacing * 1.5,
      pitch.y + spacing * 0.45,
      spacing * 2,
    );
  if (pitch.displayed !== attempt.midi)
    text(
      `${noteName(attempt.midi)}${octave(attempt.midi)} ${attempt.midi < pitch.displayed ? '↓' : '↑'}`,
      x + box.width,
      pitch.y + spacing * 0.4,
      spacing,
    );
  head.parentElement.appendChild(group);
}
