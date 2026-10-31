// Content lives here; policy and presentation consume stable IDs, not array positions.
// Bump revision when an assessment changes. Existing badges remain permanent.
export type Lesson = {
  id: string;
  revision: number;
  world: string;
  name: string;
  icon: string;
  notes: readonly number[];
  description: string;
  patterns?: readonly (readonly number[])[];
  support: 'names' | 'on-request';
  requires?: string;
  heartMultiplier: number;
  gems: number;
  assessment: {
    repetitions: number;
    accuracy: number;
    successesPerNote: number;
    fluentMs?: number;
  };
};
export type LessonBadge = {
  lessonId: string;
  revision: number;
  runId: string;
  at: number;
  gems: number;
};
export type LessonRunReward = {
  lessonId: string;
  revision: number;
  runId: string;
  at: number;
  gems: 1;
};
export type World = {
  id: string;
  name: string;
  icon: string;
  topic: string;
  entry?: boolean;
  gate?: { hearts: number; badge: string };
};

export const worlds: readonly World[] = [
  {
    id: 'garden',
    name: 'Garden',
    icon: '🌱',
    topic: 'Find white notes',
    entry: true,
  },
  {
    id: 'treehouse',
    name: 'Treehouse',
    icon: '🌳',
    topic: 'Read treble notes',
    gate: { hearts: 60, badge: 'find-octave' },
  },
  { id: 'cave', name: 'Cave', icon: '🐻', topic: 'Discover bass clef' },
  { id: 'bridges', name: 'Bridges', icon: '🌉', topic: 'Read both clefs' },
  { id: 'crystals', name: 'Crystals', icon: '🔮', topic: 'Sharps and flats' },
  { id: 'keys', name: 'Keys', icon: '🗝️', topic: 'Key signatures' },
  { id: 'river', name: 'River', icon: '🛶', topic: 'Little phrases' },
  { id: 'castle', name: 'Castle', icon: '🏰', topic: 'Notes together' },
  { id: 'scales', name: 'Meadow', icon: '🎹', topic: 'Scales and walks' },
];

const anchors = [60, 64, 67];
const five = [60, 62, 64, 65, 67];
const octave = [60, 62, 64, 65, 67, 69, 71, 72];
const assessment = { repetitions: 2, accuracy: 0.8, successesPerNote: 1 };
// Version-one content remains readable for saved encounters and earlier tabs.
export const legacyLessons: readonly Lesson[] = [
  {
    id: 'find-three',
    description: 'C · E · G · names shown',
    revision: 1,
    world: 'garden',
    name: '3 notes',
    icon: '🐣',
    notes: anchors,
    support: 'names',
    heartMultiplier: 1,
    gems: 1,
    assessment,
  },
  {
    id: 'find-five',
    description: 'C–G · names shown',
    revision: 1,
    world: 'garden',
    name: '5 notes',
    icon: '🌼',
    notes: five,
    support: 'names',
    requires: 'find-three',
    heartMultiplier: 1,
    gems: 1,
    assessment,
  },
  {
    id: 'find-octave',
    description: 'C–C · names shown',
    revision: 1,
    world: 'garden',
    name: '8 notes',
    icon: '🌈',
    notes: octave,
    support: 'names',
    requires: 'find-five',
    heartMultiplier: 1,
    gems: 1,
    assessment,
  },
  {
    id: 'read-three',
    description: 'C · E · G · names hidden',
    revision: 1,
    world: 'treehouse',
    name: '3 notes',
    icon: '🐦',
    notes: anchors,
    support: 'on-request',
    heartMultiplier: 2,
    gems: 2,
    assessment,
  },
  {
    id: 'read-five',
    description: 'C–G · names hidden',
    revision: 1,
    world: 'treehouse',
    name: '5 notes',
    icon: '🦋',
    notes: five,
    support: 'on-request',
    requires: 'read-three',
    heartMultiplier: 2,
    gems: 2,
    assessment,
  },
  {
    id: 'read-octave',
    description: 'C–C · names hidden',
    revision: 1,
    world: 'treehouse',
    name: '8 notes',
    icon: '🦉',
    notes: octave,
    support: 'on-request',
    requires: 'read-five',
    heartMultiplier: 2,
    gems: 2,
    assessment,
  },
  {
    id: 'fluent-octave',
    description: 'C–C · optional fluency challenge',
    revision: 1,
    world: 'treehouse',
    name: 'Quick',
    icon: '✨',
    notes: octave,
    support: 'on-request',
    requires: 'read-octave',
    heartMultiplier: 3,
    gems: 2,
    assessment: { ...assessment, fluentMs: 4000 },
  },
  ...[
    {
      id: 'steps-up',
      name: 'Step up',
      icon: '↗',
      description: 'Neighbouring white keys · C–D–E',
      patterns: [
        [60, 62, 64],
        [62, 64, 65],
      ],
    },
    {
      id: 'steps-down',
      name: 'Step down',
      icon: '↘',
      description: 'Neighbouring white keys · E–D–C',
      patterns: [
        [64, 62, 60],
        [65, 64, 62],
      ],
    },
    {
      id: 'skips',
      name: 'Skip a key',
      icon: '⤴',
      description: 'Skip one white key · C–E–G',
      patterns: [
        [60, 64, 67],
        [67, 64, 60],
      ],
    },
    {
      id: 'returns',
      name: 'Out and back',
      icon: '↗↘',
      description: 'A little phrase · C–D–E–D–C',
      patterns: [
        [60, 62, 64, 62, 60],
        [62, 64, 65, 64, 62],
      ],
    },
    {
      id: 'thirds',
      name: 'Thirds',
      icon: 'Ⅲ',
      description: 'Skip one white key · C–E or G–E',
      patterns: [
        [60, 64],
        [67, 64],
      ],
    },
    {
      id: 'fifths',
      name: 'Fifths',
      icon: 'Ⅴ',
      description: 'Count five white keys · C–G or A–D',
      patterns: [
        [60, 67],
        [69, 62],
      ],
    },
    {
      id: 'thirds-up',
      name: 'Moving thirds up',
      icon: '↗',
      description: 'Rising pairs · C–E, D–F, E–G',
      patterns: [
        [60, 64, 62, 65, 64, 67],
        [62, 65, 64, 67, 65, 69],
      ],
    },
    {
      id: 'thirds-down',
      name: 'Moving thirds down',
      icon: '↘',
      description: 'Falling pairs · G–E, F–D, E–C',
      patterns: [
        [67, 64, 65, 62, 64, 60],
        [69, 65, 67, 64, 65, 62],
      ],
    },
    {
      id: 'alberti',
      name: 'Alberti bass',
      icon: '🔄',
      description: 'Low–high–middle–high · C–G–E–G',
      patterns: [
        [60, 67, 64, 67],
        [62, 69, 65, 69],
      ],
    },
  ].map(
    (pattern): Lesson => ({
      ...pattern,
      revision: 1,
      world: 'river',
      notes: [...new Set(pattern.patterns.flat())],
      support: 'names',
      heartMultiplier: 1,
      gems: 1,
      assessment,
    }),
  ),
];

export const mergedLessonId = (id: string) =>
  ({
    'read-three': 'find-three',
    'read-five': 'find-five',
    'read-octave': 'find-octave',
    'fluent-octave': 'find-octave',
  })[id] ?? id;

export const lessons: readonly Lesson[] = [
  ...legacyLessons
    .filter((lesson) => lesson.world !== 'treehouse')
    .map((lesson) => ({ ...lesson, revision: 2 })),
  ...[
    {
      id: 'five-up',
      name: 'Five notes up',
      icon: '↗',
      description: 'A longer walk · C–D–E–F–G',
      world: 'scales',
      patterns: [
        [60, 62, 64, 65, 67],
        [62, 64, 65, 67, 69],
      ],
    },
    {
      id: 'five-down',
      name: 'Five notes down',
      icon: '↘',
      description: 'Walk back · G–F–E–D–C',
      world: 'scales',
      patterns: [
        [67, 65, 64, 62, 60],
        [69, 67, 65, 64, 62],
      ],
    },
    {
      id: 'scale-up',
      name: 'C scale up',
      icon: '🌈',
      description: 'All eight white notes · C4–C5',
      world: 'scales',
      patterns: [[60, 62, 64, 65, 67, 69, 71, 72]],
    },
    {
      id: 'scale-down',
      name: 'C scale down',
      icon: '🌈',
      description: 'A whole octave back · C5–C4',
      world: 'scales',
      patterns: [[72, 71, 69, 67, 65, 64, 62, 60]],
    },
    {
      id: 'repeats',
      name: 'Play it twice',
      icon: '🔁',
      description: 'Lift and play again · C–C–D–D–E–E',
      world: 'river',
      patterns: [
        [60, 60, 62, 62, 64, 64],
        [65, 65, 64, 64, 62, 62],
      ],
    },
    {
      id: 'neighbours',
      name: 'Back home',
      icon: '🏠',
      description: 'Return to one note · C–D–C–E–C–F',
      world: 'river',
      patterns: [
        [60, 62, 60, 64, 60, 65],
        [62, 64, 62, 65, 62, 67],
      ],
    },
    {
      id: 'mixed-steps',
      name: 'Steps and skips',
      icon: '🐾',
      description: 'Changing distances · C–D–F–E–G',
      world: 'river',
      patterns: [
        [60, 62, 65, 64, 67],
        [62, 64, 67, 65, 69],
      ],
    },
    {
      id: 'broken-chords',
      name: 'Chord fountain',
      icon: '⛲',
      description: 'Up and back · C–E–G–E–C',
      world: 'river',
      patterns: [
        [60, 64, 67, 64, 60],
        [62, 65, 69, 65, 62],
      ],
    },
    {
      id: 'moving-fifths',
      name: 'Moving fifths',
      icon: 'Ⅴ',
      description: 'Bigger pairs · C–G, D–A, E–B',
      world: 'river',
      patterns: [
        [60, 67, 62, 69, 64, 71],
        [71, 64, 69, 62, 67, 60],
      ],
    },
  ].map(
    (pattern): Lesson => ({
      ...pattern,
      revision: 2,
      notes: [...new Set(pattern.patterns.flat())],
      support: 'names',
      heartMultiplier: 1,
      gems: 1,
      assessment,
    }),
  ),
];
