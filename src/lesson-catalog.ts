// Content lives here; policy and presentation consume stable IDs, not array positions.
// Bump revision when an assessment changes. Existing badges remain permanent.
export type Lesson = {
  id: string;
  revision: number;
  world: string;
  name: string;
  icon: string;
  notes: readonly number[];
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
];

const anchors = [60, 64, 67];
const five = [60, 62, 64, 65, 67];
const octave = [60, 62, 64, 65, 67, 69, 71, 72];
const assessment = { repetitions: 2, accuracy: 0.8, successesPerNote: 1 };
export const lessons: readonly Lesson[] = [
  {
    id: 'find-three',
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
];
