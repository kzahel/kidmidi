import type { Position } from './music';

export type PlayedAttempt = {
  position: Position;
  midi: number;
  target: number;
};
export type ScoreAttempt = { index: number; midi: number; target: number };

const letterSteps = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
export function staffStep(midi: number) {
  return Math.floor(midi / 12) * 7 + letterSteps[midi % 12];
}

// Keep extreme input on this staff without moving or shrinking the engraving.
// Octave displacement is always labelled with the original performed pitch.
export function ghostPitch(
  midi: number,
  target: number,
  targetY: number,
  spacing: number,
  top: number,
  bottom: number,
) {
  let displayed = midi;
  let y = targetY - ((staffStep(displayed) - staffStep(target)) * spacing) / 2;
  while (y < top) {
    displayed -= 12;
    y += spacing * 3.5;
  }
  while (y > bottom) {
    displayed += 12;
    y -= spacing * 3.5;
  }
  return { displayed, y };
}

export function ghostAccidental(midi: number, fifths: number) {
  if ([1, 3, 6, 8, 10].includes(midi % 12)) return '♯';
  const altered = fifths > 0 ? [5, 0, 7, 2, 9, 4, 11] : [11, 4, 9, 2, 7, 0, 5];
  return altered.slice(0, Math.abs(fifths)).includes(midi % 12) ? '♮' : '';
}
