import type { NoteHit } from './feedback';
import type { Note, Song } from './music';

export type PlayedNote = {
  id: number;
  inputId: string;
  midi: number;
  velocity: number;
  onsetMs: number;
  offsetMs?: number;
  groupIndex?: number;
};
const chordWindowMs = 80;
const quarterMs = 500;

export class ExploreRecorder {
  private notes: PlayedNote[] = [];
  private held = new Map<string, PlayedNote>();
  private serial = 0;
  private groupIndex = -1;
  private groupStart = -Infinity;
  private groupPitches = new Set<number>();
  private clockShift: number | null = 0;

  constructor(
    private emit: (notes: PlayedNote[]) => void,
    private options: {
      recentGroups?: number;
      onWrite?: (notes: PlayedNote[]) => void;
    } = {},
  ) {}

  get count() {
    return this.notes.length;
  }
  get nextGroup() {
    return this.groupIndex + 1;
  }
  getNotes() {
    return this.notes.map((note) => ({ ...note }));
  }

  noteOn(inputId: string, midi: number, atMs: number, velocity: number) {
    if (this.held.has(inputId)) return;
    if (this.clockShift === null) {
      const end = this.notes.reduce(
        (max, note) => Math.max(max, note.offsetMs ?? note.onsetMs),
        0,
      );
      this.clockShift = (this.notes.length ? end + 500 : 0) - atMs;
    }
    const onsetMs = atMs + this.clockShift;
    if (
      onsetMs - this.groupStart > chordWindowMs ||
      this.groupPitches.has(midi)
    ) {
      this.groupIndex++;
      this.groupStart = onsetMs;
      this.groupPitches.clear();
    }
    this.groupPitches.add(midi);
    const note = {
      id: ++this.serial,
      inputId,
      midi,
      velocity,
      onsetMs,
      groupIndex: this.groupIndex,
    };
    this.notes.push(note);
    this.held.set(inputId, note);
    this.options.onWrite?.([{ ...note }]);
    this.publish();
  }

  noteOff(inputId: string, atMs: number) {
    const note = this.held.get(inputId);
    const offsetMs = atMs + (this.clockShift ?? 0);
    if (!note || offsetMs < note.onsetMs) return;
    note.offsetMs = offsetMs;
    this.held.delete(inputId);
    this.options.onWrite?.([{ ...note }]);
    this.publish();
  }

  releaseAll(atMs: number) {
    if (!this.held.size) return;
    const changed = [...this.held.values()];
    for (const note of changed)
      note.offsetMs = Math.max(note.onsetMs, atMs + (this.clockShift ?? 0));
    this.held.clear();
    this.options.onWrite?.(changed.map((note) => ({ ...note })));
    this.publish();
  }

  load(notes: readonly PlayedNote[]) {
    this.held.clear();
    this.notes = notes.map((note) => ({
      ...note,
      offsetMs: note.offsetMs ?? note.onsetMs + 300,
    }));
    const groups = groupPlayedNotes(this.notes);
    groups.forEach((group, index) =>
      group.notes.forEach((note) => {
        note.groupIndex = index;
      }),
    );
    this.serial = this.notes.reduce((max, note) => Math.max(max, note.id), 0);
    this.groupIndex = groups.length - 1;
    this.groupStart = -Infinity;
    this.groupPitches.clear();
    this.clockShift = null;
    this.publish();
  }

  breakGroup() {
    this.groupStart = -Infinity;
    this.groupPitches.clear();
  }

  clear() {
    this.notes = [];
    this.held.clear();
    this.serial = 0;
    this.groupIndex = -1;
    this.groupStart = -Infinity;
    this.groupPitches.clear();
    this.clockShift = 0;
    this.publish();
  }

  private publish() {
    let first = 0;
    if (this.options.recentGroups) {
      const minimum = this.groupIndex - this.options.recentGroups + 1;
      first = this.notes.length;
      while (first > 0 && (this.notes[first - 1].groupIndex ?? 0) >= minimum)
        first--;
    }
    this.emit(this.notes.slice(first).map((note) => ({ ...note })));
  }
}

export type PlayedGroup = {
  id: number;
  onsetMs: number;
  notes: PlayedNote[];
  beats: number;
};

// Loose sequential notation: nearby attacks form chords; pauses do not become
// a wall of rests. Preserve raw timing separately from this display interpretation.
export function groupPlayedNotes(notes: readonly PlayedNote[]): PlayedGroup[] {
  const groups: PlayedGroup[] = [];
  for (const note of notes) {
    const last = groups.at(-1);
    if (
      last &&
      (last.notes[0].groupIndex === undefined ||
        note.groupIndex === undefined ||
        last.notes[0].groupIndex === note.groupIndex) &&
      note.onsetMs - last.onsetMs <= chordWindowMs &&
      !last.notes.some((member) => member.midi === note.midi)
    ) {
      last.notes.push(note);
    } else {
      groups.push({
        id: note.id,
        onsetMs: note.onsetMs,
        notes: [note],
        beats: 1,
      });
    }
  }
  for (const [index, group] of groups.entries()) {
    const released = group.notes.every((note) => note.offsetMs !== undefined);
    const holdMs = released
      ? Math.max(
          ...group.notes.map(
            (note) => (note.offsetMs ?? note.onsetMs) - group.onsetMs,
          ),
        )
      : quarterMs;
    const gap = groups[index + 1]
      ? groups[index + 1].onsetMs - group.onsetMs
      : undefined;
    // Use attack spacing for ordinary staccato/legato runs. A long pause is
    // deliberately discarded, so taking time to find a key doesn't add rests.
    const durationMs = gap !== undefined && gap < 1600 ? gap : holdMs;
    const beats = Math.max(0.5, Math.min(4, durationMs / quarterMs));
    group.beats = [0.5, 1, 2, 4].reduce(
      (best, value) =>
        Math.abs(value - beats) < Math.abs(best - beats) ? value : best,
      1,
    );
  }
  return groups;
}

type Segment = {
  group?: PlayedGroup;
  ticks: number;
  tieFrom: boolean;
  tieTo: boolean;
};
type Measure = Segment[];
const values = [8, 4, 2, 1]; // divisions=2: whole, half, quarter, eighth.
const noteType = (ticks: number) =>
  ({ 1: 'eighth', 2: 'quarter', 4: 'half', 8: 'whole' })[ticks];
const steps = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
const sharps = new Set([1, 3, 6, 8, 10]);

function makeMeasures(groups: PlayedGroup[]): Measure[] {
  const measures: Measure[] = [[]];
  let used = 0;
  for (const group of groups) {
    let left = group.beats * 2;
    let first = true;
    while (left) {
      if (used === 8) {
        measures.push([]);
        used = 0;
      }
      const ticks =
        values.find((value) => value <= Math.min(left, 8 - used)) ?? 1;
      measures
        .at(-1)
        ?.push({ group, ticks, tieFrom: !first, tieTo: left > ticks });
      left -= ticks;
      used += ticks;
      first = false;
    }
  }
  while (used < 8) {
    const ticks = values.find((value) => value <= 8 - used) ?? 1;
    measures.at(-1)?.push({ ticks, tieFrom: false, tieTo: false });
    used += ticks;
  }
  return measures;
}

function staffNotes(
  segment: Segment,
  staff: number,
  grandStaff: boolean,
): string {
  const notes =
    segment.group?.notes
      .filter((note) => !grandStaff || (note.midi < 60 ? 2 : 1) === staff)
      .sort((a, b) => a.midi - b.midi) ?? [];
  const voice = `<voice>${staff}</voice><type>${noteType(segment.ticks)}</type><staff>${staff}</staff>`;
  if (!notes.length)
    return `<note><rest/><duration>${segment.ticks}</duration>${voice}</note>`;
  return notes
    .map((note, index) => {
      const pitch = `<pitch><step>${steps[note.midi % 12]}</step>${sharps.has(note.midi % 12) ? '<alter>1</alter>' : ''}<octave>${Math.floor(note.midi / 12) - 1}</octave></pitch>`;
      const ties = `${segment.tieFrom ? '<tie type="stop"/>' : ''}${segment.tieTo ? '<tie type="start"/>' : ''}`;
      const notations =
        segment.tieFrom || segment.tieTo
          ? `<notations>${segment.tieFrom ? '<tied type="stop"/>' : ''}${segment.tieTo ? '<tied type="start"/>' : ''}</notations>`
          : '';
      return `<note>${index ? '<chord/>' : ''}${pitch}<duration>${segment.ticks}</duration>${ties}${voice}${notations}</note>`;
    })
    .join('');
}

function encodeMeasures(
  measures: Measure[],
  firstMeasure: number,
  grandStaff: boolean,
): { xml: string; active: number } {
  let active = 0;
  let cursor = 0;
  const content = measures
    .map((measure, index) => {
      let notes = '';
      for (const segment of measure) {
        if (segment.group) active = cursor;
        notes += staffNotes(segment, 1, grandStaff);
        cursor++;
      }
      if (grandStaff)
        notes += `<backup><duration>8</duration></backup>${measure.map((segment) => staffNotes(segment, 2, true)).join('')}`;
      const attributes =
        index === 0
          ? `<attributes><divisions>2</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time>${grandStaff ? '<staves>2</staves>' : ''}<clef number="1"><sign>G</sign><line>2</line></clef>${grandStaff ? '<clef number="2"><sign>F</sign><line>4</line></clef>' : ''}</attributes>`
          : '';
      const lineBreak =
        index > 0 && index % 2 === 0 ? '<print new-system="yes"/>' : '';
      return `<measure number="${firstMeasure + index}">${lineBreak}${attributes}${notes}</measure>`;
    })
    .join('');
  return {
    active,
    xml: `<?xml version="1.0" encoding="utf-8"?><score-partwise version="4.0"><work><work-title>Just explore</work-title></work><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${content}</part></score-partwise>`,
  };
}

export function exploreNotation(
  notes: readonly PlayedNote[],
  multiline: boolean,
) {
  const groups = groupPlayedNotes(notes);
  const measures = makeMeasures(groups);
  const grandStaff = notes.some((note) => note.midi < 60);
  const windowSize = multiline ? 4 : 2;
  const start = Math.max(0, measures.length - windowSize);
  const shown = encodeMeasures(measures.slice(start), start + 1, grandStaff);
  const latest = groups.at(-1);
  const held =
    latest?.notes.some((note) => note.offsetMs === undefined) ?? false;
  const hit: NoteHit | null = latest
    ? {
        id: latest.id,
        inputId: latest.notes[0].inputId,
        position: { phrase: 0, note: shown.active, complete: false },
        midi: latest.notes[0].midi,
        startedAt: latest.onsetMs,
        durationMs: latest.beats * quarterMs,
        released: !held,
      }
    : null;
  return {
    xml: shown.xml,
    active: shown.active,
    hit,
    downloadXml: encodeMeasures(measures, 1, grandStaff).xml,
    measureCount: measures.length,
    firstMeasure: start + 1,
  };
}

export const exploreSong: Song = {
  id: 'explore',
  title: 'Just explore',
  subtitle: '',
  icon: '',
  phrases: [],
};
export const emptyNotes: Note[] = [];
