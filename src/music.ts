import { rainSong } from './rain';

export type Note = {
  midi: number;
  beats: 0.5 | 1 | 2;
  lyric?: string;
  chord?: 'D' | 'A' | 'G';
  stem?: 'up' | 'down';
};
export type Notation = {
  title?: string;
  keyFifths?: number;
  timeSignature?: { beats: number; beatType: 4 };
  composer?: string;
  lyricist?: string;
  measuresPerSystem?: number;
  startMeasure?: number;
  finalBarline?: boolean;
};
export type Song = Notation & {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  phrases: Note[][];
  source?: {
    image: string;
    illustrationViewBox: string;
    illustrationAlt: string;
    credit: string;
  };
};

const phrase = (pitches: number[], lyrics: string[]): Note[] =>
  pitches.map((midi, index) => ({
    midi,
    beats: index === pitches.length - 1 ? 2 : 1,
    lyric: lyrics[index],
  }));

export const songs: Song[] = [
  {
    id: 'twinkle',
    title: 'Twinkle, Twinkle',
    subtitle: 'A familiar little star',
    icon: '✦',
    phrases: [
      phrase(
        [60, 60, 67, 67, 69, 69, 67],
        ['Twin-', 'kle,', 'twin-', 'kle,', 'lit-', 'tle', 'star'],
      ),
      phrase(
        [65, 65, 64, 64, 62, 62, 60],
        ['How', 'I', 'won-', 'der', 'what', 'you', 'are'],
      ),
      phrase(
        [67, 67, 65, 65, 64, 64, 62],
        ['Up', 'a-', 'bove', 'the', 'world', 'so', 'high'],
      ),
      phrase(
        [67, 67, 65, 65, 64, 64, 62],
        ['Like', 'a', 'dia-', 'mond', 'in', 'the', 'sky'],
      ),
      phrase(
        [60, 60, 67, 67, 69, 69, 67],
        ['Twin-', 'kle,', 'twin-', 'kle,', 'lit-', 'tle', 'star'],
      ),
      phrase(
        [65, 65, 64, 64, 62, 62, 60],
        ['How', 'I', 'won-', 'der', 'what', 'you', 'are'],
      ),
    ],
  },
  {
    id: 'buns',
    title: 'Hot Cross Buns',
    subtitle: 'Three notes to get going',
    icon: '☀',
    phrases: [
      [
        { midi: 64, beats: 1, lyric: 'Hot' },
        { midi: 62, beats: 1, lyric: 'cross' },
        { midi: 60, beats: 2, lyric: 'buns' },
      ],
      [
        { midi: 64, beats: 1, lyric: 'Hot' },
        { midi: 62, beats: 1, lyric: 'cross' },
        { midi: 60, beats: 2, lyric: 'buns' },
      ],
      [60, 60, 60, 60, 62, 62, 62, 62].map((midi, index) => ({
        midi,
        beats: 1,
        lyric: ['One', 'a', 'pen-', 'ny,', 'two', 'a', 'pen-', 'ny'][index],
      })),
      [
        { midi: 64, beats: 1, lyric: 'Hot' },
        { midi: 62, beats: 1, lyric: 'cross' },
        { midi: 60, beats: 2, lyric: 'buns' },
      ],
    ],
  },
  rainSong,
];

export const noteName = (midi: number) =>
  ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][midi % 12];
export const octave = (midi: number) => Math.floor(midi / 12) - 1;

export type NoteEvent = {
  type: 'on' | 'off';
  note: number;
  velocity: number;
  channel: number;
  atMs?: number;
};

// Web MIDI messages arrive complete. Native adapters can feed this same contract later.
export function parseMidi(data: ArrayLike<number>): NoteEvent | null {
  if (data.length < 3) return null;
  const [status, note, velocity] = [data[0], data[1], data[2]];
  if (note > 127 || velocity > 127 || note < 0 || velocity < 0) return null;
  const command = status & 0xf0;
  if (command !== 0x90 && command !== 0x80) return null;
  return {
    type: command === 0x90 && velocity > 0 ? 'on' : 'off',
    note,
    velocity,
    channel: status & 0x0f,
  };
}

export type Position = { phrase: number; note: number; complete: boolean };
export const startPosition = (): Position => ({
  phrase: 0,
  note: 0,
  complete: false,
});
export function advance(
  song: Song,
  position: Position,
  midi: number,
): Position {
  if (
    position.complete ||
    song.phrases[position.phrase][position.note].midi !== midi
  )
    return position;
  if (position.note + 1 < song.phrases[position.phrase].length)
    return { ...position, note: position.note + 1 };
  if (position.phrase + 1 < song.phrases.length)
    return { phrase: position.phrase + 1, note: 0, complete: false };
  return { ...position, complete: true };
}

const xmlText = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function musicXml(notes: Note[], notation: Notation = {}): string {
  const meter = notation.timeSignature ?? { beats: 4, beatType: 4 };
  const measures: string[] = [];
  let beat = 0;
  let measure = '';
  let continuingWord = false;
  for (const note of notes) {
    const name = noteName(note.midi);
    if (beat + note.beats > meter.beats)
      throw new Error('A note crosses a barline without a tie.');
    if (note.chord) {
      measure += `<harmony placement="above"><root><root-step>${note.chord}</root-step></root><kind>major</kind></harmony>`;
    }
    let lyric = '';
    if (note.lyric) {
      const continues = note.lyric.endsWith('-');
      const syllabic = continuingWord
        ? continues
          ? 'middle'
          : 'end'
        : continues
          ? 'begin'
          : 'single';
      lyric = `<lyric><syllabic>${syllabic}</syllabic><text>${xmlText(continues ? note.lyric.slice(0, -1) : note.lyric)}</text></lyric>`;
      continuingWord = continues;
    }
    const type =
      note.beats === 0.5 ? 'eighth' : note.beats === 2 ? 'half' : 'quarter';
    measure += `<note><pitch><step>${name[0]}</step>${name.includes('♯') ? '<alter>1</alter>' : ''}<octave>${octave(note.midi)}</octave></pitch><duration>${note.beats * 2}</duration><type>${type}</type>${note.stem ? `<stem>${note.stem}</stem>` : ''}${lyric}</note>`;
    beat += note.beats;
    if (beat === meter.beats) {
      measures.push(measure);
      measure = '';
      beat = 0;
    }
  }
  if (measure) throw new Error('The score ends with an incomplete bar.');
  const metadata = `<work><work-title>${xmlText(notation.title ?? '')}</work-title></work><identification>${notation.composer ? `<creator type="composer">${xmlText(notation.composer)}</creator>` : ''}${notation.lyricist ? `<creator type="lyricist">${xmlText(notation.lyricist)}</creator>` : ''}</identification>`;
  const attributes = `<attributes><divisions>2</divisions><key><fifths>${notation.keyFifths ?? 0}</fifths></key><time><beats>${meter.beats}</beats><beat-type>${meter.beatType}</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`;
  return `<?xml version="1.0" encoding="utf-8"?><score-partwise version="4.0">${metadata}<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${measures.map((content, i) => `<measure number="${i + (notation.startMeasure ?? 1)}">${notation.measuresPerSystem && i > 0 && i % notation.measuresPerSystem === 0 ? '<print new-system="yes"/>' : ''}${i === 0 ? attributes : ''}${content}${i === measures.length - 1 && notation.finalBarline !== false ? '<barline location="right"><bar-style>light-heavy</bar-style></barline>' : ''}</measure>`).join('')}</part></score-partwise>`;
}
