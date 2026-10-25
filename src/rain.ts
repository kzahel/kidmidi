import type { Note, Song } from './music';

// Transcribed from the owner's supplied photograph, page 17.
// Each group is one printed bar. Quarter-note beats: eighth = 0.5.
const bar = (
  pitches: number[],
  lyrics: string[],
  chords: Record<number, Note['chord']> = {},
  quarterAt: number[] = [],
): Note[] =>
  pitches.map((midi, index) => ({
    midi,
    beats: quarterAt.includes(index) ? 1 : 0.5,
    lyric: lyrics[index],
    chord: chords[index],
    stem: midi >= 71 ? 'down' : 'up',
  }));

export const rainBars: Note[][] = [
  bar([69, 67, 66, 64], ['Rä-', 'ge-', 'Rä-', 'ge-'], { 0: 'D', 2: 'A' }),
  bar([66, 62, 62], ['tröpf-', 'li,', 'es'], { 0: 'D' }, [0]),
  bar([69, 67, 66, 64], ['räg-', 'net', 'uf', 'mys'], { 2: 'A' }),
  bar([66, 62, 62], ['Chöpf-', 'li.', 'Wänn s'], { 0: 'D' }, [0]),
  bar([71, 71, 74, 71], ['räg-', 'net,', 'wer-', 'ded'], { 0: 'G' }),
  bar([71, 69, 69, 66], ['d Blüem-', 'li', 'nass', 'und'], { 0: 'D' }),
  bar([69, 67, 67, 64], ['a-', 'li', 'Steind-', 'li'], { 0: 'A' }),
  bar([67, 66, 66, 62], ['uf', 'der', 'Gass.', 'Wänn s'], { 0: 'D' }),
  bar([71, 71, 74, 71], ['räg-', 'net,', 'wer-', 'det'], { 0: 'G' }),
  bar([71, 69, 69, 66], ['d Blüem-', 'li', 'nass', 'und'], { 0: 'D' }),
  bar([69, 67, 67, 64], ['a-', 'li', 'Steind-', 'li'], { 0: 'A' }),
  bar([62, 66, 62], ['uf', 'der', 'Gass.'], { 0: 'D' }, [2]),
];

export const rainSong: Song = {
  id: 'rain',
  title: 'Räge-Rägetröpfli',
  subtitle: '',
  icon: '',
  keyFifths: 2,
  timeSignature: { beats: 2, beatType: 4 },
  composer: 'C. Ruckstuhl',
  lyricist: 'I. Spühler-Suter',
  measuresPerSystem: 3,
  source: {
    image: '/book/rain-source.jpg',
    illustrationViewBox: '1035 1040 420 850',
    illustrationAlt:
      'Rain falling over two houses, with a child, a fence and flowers — from the supplied songbook photo.',
    credit: 'C. Ruckstuhl · I. Spühler-Suter',
  },
  phrases: [0, 3, 6, 9].map((start) => rainBars.slice(start, start + 3).flat()),
};
