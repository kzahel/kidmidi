import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ExploreRecorder,
  exploreNotation,
  groupPlayedNotes,
  maxExploreNotes,
  type PlayedNote,
} from '../src/explore';

const note = (
  id: number,
  midi: number,
  onsetMs: number,
  offsetMs?: number,
): PlayedNote => ({
  id,
  inputId: `key-${id}`,
  midi,
  velocity: 90,
  onsetMs,
  offsetMs,
});
const attackCount = (xml: string) =>
  [...xml.matchAll(/<note>(.*?)<\/note>/g)].filter(
    ([, content]) =>
      !content.includes('<rest') && !content.includes('<tie type="stop"'),
  ).length;

function checkBars(xml: string) {
  for (const [, measure] of xml.matchAll(/<measure[^>]*>(.*?)<\/measure>/g)) {
    const totals = new Map<string, number>();
    for (const [, content] of measure.matchAll(/<note>(.*?)<\/note>/g)) {
      if (content.includes('<chord/>')) continue;
      const voice = content.match(/<voice>(\d+)<\/voice>/)?.[1];
      const duration = Number(
        content.match(/<duration>(\d+)<\/duration>/)?.[1],
      );
      assert.ok(voice && duration > 0);
      totals.set(voice, (totals.get(voice) ?? 0) + duration);
    }
    for (const total of totals.values()) assert.equal(total, 8);
  }
}

test('live recording preserves attacks and release times without mutating prior snapshots', () => {
  let take: PlayedNote[] = [];
  const recorder = new ExploreRecorder((notes) => {
    take = notes;
  });
  recorder.noteOn('C', 60, 100, 90);
  const previous = take;
  recorder.noteOn('C', 60, 110, 90);
  assert.equal(take.length, 1);
  recorder.noteOff('C', 90);
  assert.equal(take[0].offsetMs, undefined);
  recorder.noteOff('C', 400);
  assert.equal(previous[0].offsetMs, undefined);
  assert.equal(take[0].offsetMs, 400);
  recorder.noteOn('C', 60, 500, 80);
  recorder.releaseAll(800);
  assert.deepEqual(
    take.map((entry) => [entry.midi, entry.onsetMs, entry.offsetMs]),
    [
      [60, 100, 400],
      [60, 500, 800],
    ],
  );
  recorder.clear();
  assert.deepEqual(take, []);
});

test('loose grouping keeps chords together, preserves repeated attacks and ignores long silent gaps', () => {
  const groups = groupPlayedNotes([
    note(1, 60, 0, 100),
    note(2, 64, 25, 150),
    note(3, 67, 40, 200),
    note(4, 60, 500, 900),
    note(5, 60, 9000, 9250),
  ]);
  assert.deepEqual(
    groups.map((group) => group.notes.map((entry) => entry.midi)),
    [[60, 64, 67], [60], [60]],
  );
  assert.deepEqual(
    groups.map((group) => group.beats),
    [1, 1, 0.5],
  );
  assert.equal(
    groupPlayedNotes([note(1, 60, 0, 5), note(2, 60, 20, 25)]).length,
    2,
  );
});

test('notation fills 4/4 bars, ties sustained notes across bars and represents both piano staves', () => {
  const notes = [
    note(1, 60, 0, 450),
    note(2, 62, 500, 950),
    note(3, 64, 1000, 1450),
    note(4, 65, 1500, 2500),
  ];
  const score = exploreNotation(notes, true);
  assert.equal(score.measureCount, 2);
  assert.equal(attackCount(score.downloadXml), 4);
  assert.match(score.downloadXml, /<tie type="start"/);
  assert.match(score.downloadXml, /<tie type="stop"/);
  checkBars(score.downloadXml);
  const chord = exploreNotation(
    [note(1, 48, 0, 500), note(2, 60, 20, 500), note(3, 64, 30, 500)],
    true,
  );
  assert.match(chord.xml, /<staves>2<\/staves>/);
  assert.match(chord.xml, /<sign>F<\/sign>/);
  assert.match(chord.xml, /<chord\/>/);
  assert.equal(attackCount(chord.xml), 3);
  checkBars(chord.xml);
});

test('live display stays bounded while the download retains the complete take', () => {
  const notes = Array.from({ length: 70 }, (_, index) =>
    note(index + 1, 60 + (index % 12), index * 500, index * 500 + 400),
  );
  const compact = exploreNotation(notes, false);
  const multiline = exploreNotation(notes, true);
  assert.equal(compact.measureCount, 18);
  assert.equal((compact.xml.match(/<measure /g) ?? []).length, 2);
  assert.equal((multiline.xml.match(/<measure /g) ?? []).length, 8);
  assert.equal(attackCount(compact.downloadXml), 70);
  checkBars(compact.xml);
  checkBars(multiline.xml);
  checkBars(exploreNotation([], false).xml);
  let count = 0;
  const recorder = new ExploreRecorder((take) => {
    count = take.length;
  });
  for (let index = 0; index <= maxExploreNotes; index++) {
    recorder.noteOn(`key-${index}`, 60, index * 500, 90);
    recorder.noteOff(`key-${index}`, index * 500 + 200);
  }
  assert.equal(count, maxExploreNotes);
});
