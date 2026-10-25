import assert from 'node:assert/strict';
import test from 'node:test';
import { ExploreRecorder, type PlayedNote } from '../src/explore';
import { liveGrid, livePage } from '../src/live-score';
import {
  parseRecordingFile,
  type Recording,
  RecordingLibrary,
  recordingFile,
} from '../src/recordings';

test('fixed live slots keep existing positions, fill a reserved page then wipe without losing the take', () => {
  let recent: PlayedNote[] = [];
  let writes = 0;
  const recorder = new ExploreRecorder(
    (notes) => {
      recent = notes;
    },
    {
      recentGroups: 32,
      onWrite: (notes) => {
        writes += notes.length;
      },
    },
  );
  const layout = liveGrid(1100, 400, false, 'kid');
  assert.equal(layout.capacity, 8);
  for (let i = 0; i < 8; i++) {
    recorder.noteOn(`key-${i}`, 60 + i, i * 500, 90);
    recorder.noteOff(`key-${i}`, i * 500 + 250);
  }
  assert.deepEqual(
    livePage(recent, 8).groups.map((group) => group.slot),
    [0, 1, 2, 3, 4, 5, 6, 7],
  );
  recorder.noteOn('next', 72, 4000, 90);
  recorder.noteOff('next', 4250);
  assert.equal(livePage(recent, 8).start, 8);
  assert.equal(livePage(recent, 8).groups.length, 1);
  assert.equal(recorder.count, 9);
  for (let i = 9; i < 1500; i++) {
    recorder.noteOn(`key-${i}`, 60, i * 500, 90);
    recorder.noteOff(`key-${i}`, i * 500 + 250);
  }
  assert.equal(recent.length, 32);
  assert.equal(recorder.getNotes().length, 1500);
  assert.equal(writes, 3000);
  assert.equal(livePage(recent, 8, recorder.nextGroup).groups.length, 0);
  assert.equal(liveGrid(390, 600, true, 'kid').columns, 1);
});

test('resumed recordings retain timing and IDs while new input appends after the previous end', () => {
  const recorder = new ExploreRecorder(() => {});
  recorder.load([
    {
      id: 1,
      inputId: 'a',
      midi: 60,
      velocity: 90,
      onsetMs: 1000,
      offsetMs: 5000,
    },
    {
      id: 2,
      inputId: 'b',
      midi: 64,
      velocity: 90,
      onsetMs: 2000,
      offsetMs: 2500,
    },
  ]);
  recorder.noteOn('new', 67, 10, 80);
  recorder.noteOff('new', 210);
  const notes = recorder.getNotes();
  assert.equal(notes[2].id, 3);
  assert.equal(notes[2].onsetMs, 5500);
  assert.equal(notes[2].offsetMs, 5700);
  assert.equal(notes[2].groupIndex, 2);
});

test('recording files round trip raw performance and reject invalid pitches, times and formats', () => {
  const recording: Recording = {
    id: 'test',
    title: 'A little tune',
    createdAt: 123,
    updatedAt: 123,
    noteCount: 1,
    lastMs: 400,
  };
  const notes: PlayedNote[] = [
    {
      id: 1,
      inputId: 'key',
      midi: 60,
      velocity: 90,
      onsetMs: 100,
      offsetMs: 400,
    },
  ];
  assert.deepEqual(parseRecordingFile(recordingFile(recording, notes)), {
    title: recording.title,
    notes,
  });
  for (const bad of [
    { ...notes[0], midi: 200 },
    { ...notes[0], offsetMs: 50 },
    { ...notes[0], velocity: 0 },
  ])
    assert.throws(() => parseRecordingFile(recordingFile(recording, [bad])));
  assert.throws(() => parseRecordingFile('{"notes":[]}'));
});

test('unavailable browser storage reports failure and retains complete unsaved sessions for download', async () => {
  const library = new RecordingLibrary(() => {});
  const recorder = new ExploreRecorder(() => {}, {
    onWrite: (notes) => library.capture(notes),
  });
  recorder.noteOn('a', 60, 100, 90);
  recorder.noteOff('a', 400);
  const id = library.state.current!.id;
  await library.flush();
  assert.equal(library.state.status, 'error');
  library.newSession();
  recorder.clear();
  const recovered = await library.read(id);
  assert.equal(recovered.length, 1);
  assert.equal(recovered[0].offsetMs, 400);
  assert.match(library.state.error, /Download a recording/);
  library.dispose();
});

test('clearing the visual page starts a fresh slot even when another chord-window attack follows immediately', () => {
  let notes: PlayedNote[] = [];
  const recorder = new ExploreRecorder((value) => {
    notes = value;
  });
  recorder.noteOn('a', 60, 0, 90);
  recorder.noteOff('a', 10);
  recorder.breakGroup();
  const after = recorder.nextGroup;
  recorder.noteOn('b', 64, 20, 90);
  const page = livePage(notes, 8, after);
  assert.equal(page.groups.length, 1);
  assert.deepEqual(
    page.groups[0].notes.map((note) => note.midi),
    [64],
  );
  assert.equal(page.groups[0].slot, 0);
});
