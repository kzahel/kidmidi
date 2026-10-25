import assert from 'node:assert/strict';
import test from 'node:test';
import type { FeedbackClock } from '../src/feedback';
import { chooseMidiOutput } from '../src/midi-device';
import {
  PhrasePreview,
  type PreviewOutput,
  type PreviewState,
} from '../src/phrase-preview';

const notes = [
  { midi: 60, beats: 1 },
  { midi: 60, beats: 0.5 },
  { midi: 64, beats: 2 },
] as const;
function fixture(open = async () => {}) {
  const messages: { data: number[]; when?: number }[] = [];
  let clears = 0,
    speakers = 0,
    stops = 0;
  let timer: (() => void) | undefined;
  const clock: FeedbackClock = {
    now: () => 1000,
    schedule: (callback) => {
      timer = callback;
      return 1;
    },
    cancel: () => {
      timer = undefined;
    },
  };
  const output = {
    open,
    send: (data: number[], when?: number) =>
      messages.push({ data: [...data], when }),
    clear: () => {
      clears++;
    },
  } as unknown as PreviewOutput;
  let state: PreviewState = { playing: false, error: '' };
  const player = new PhrasePreview(
    (next) => {
      state = next;
    },
    {
      hear: () => {
        speakers++;
      },
      stopAll: () => {
        stops++;
      },
      close: () => {},
    },
    clock,
  );
  return {
    player,
    output,
    messages,
    state: () => state,
    clears: () => clears,
    speakers: () => speakers,
    stops: () => stops,
    finish: () => timer?.(),
  };
}

test('phrase preview schedules MIDI notes and releases, then cancels queued notes without broad device resets', async () => {
  const f = fixture();
  await f.player.hear([...notes], f.output);
  assert.equal(f.speakers(), 0);
  assert.equal(f.player.midiPlaying, true);
  assert.deepEqual(f.messages, [
    { data: [0x90, 60, 90], when: 1080 },
    { data: [0x80, 60, 0], when: 1520 },
    { data: [0x90, 60, 90], when: 1560 },
    { data: [0x80, 60, 0], when: 1760 },
    { data: [0x90, 64, 90], when: 1800 },
    { data: [0x80, 64, 0], when: 2720 },
  ]);
  f.player.stop();
  assert.equal(f.clears(), 1);
  assert.equal(f.state().playing, false);
  assert.deepEqual(f.messages.slice(6), [
    { data: [0x80, 60, 0], when: undefined },
    { data: [0x80, 64, 0], when: undefined },
  ]);
  assert.equal(
    f.messages.some((message) => (message.data[0] & 0xf0) === 0xb0),
    false,
  );
  await f.player.hear([...notes], f.output);
  f.finish();
  assert.equal(f.state().playing, false);
  assert.equal(f.player.midiPlaying, false);
});

test('preview uses speakers without an output or on failure and cannot play late after cancellation', async () => {
  const speaker = fixture();
  await speaker.player.hear([...notes]);
  assert.equal(speaker.speakers(), 1);
  speaker.player.stop();
  assert.ok(speaker.stops() > 0);
  const failed = fixture(async () => {
    throw new Error('unplugged');
  });
  await failed.player.hear([...notes], failed.output);
  assert.equal(failed.speakers(), 1);
  assert.match(failed.state().error, /using speakers/);
  let resolve!: () => void;
  const pending = fixture(
    () =>
      new Promise<void>((done) => {
        resolve = done;
      }),
  );
  const starting = pending.player.hear([...notes], pending.output);
  pending.player.stop();
  resolve();
  await starting;
  assert.equal(pending.messages.length, 0);
  assert.equal(pending.speakers(), 0);
  assert.equal(pending.state().playing, false);
});

test('output matching pairs the selected input by identity, avoids unrelated virtual ports and preserves explicit choices', () => {
  const input = {
    id: 'in',
    name: 'CASIO USB-MIDI Input',
    manufacturer: 'Casio',
  };
  const casio = {
    id: 'out',
    name: 'CASIO USB-MIDI Output',
    manufacturer: 'Casio',
  };
  const through = {
    id: 'through',
    name: 'Midi Through Port-0',
    manufacturer: 'ALSA',
  };
  const other = { id: 'other', name: 'Other synth', manufacturer: 'Other' };
  assert.equal(chooseMidiOutput([through, other, casio], input, 'auto'), casio);
  assert.equal(chooseMidiOutput([through, other], input, 'auto'), undefined);
  assert.equal(chooseMidiOutput([casio], input, 'speakers'), undefined);
  assert.equal(chooseMidiOutput([casio, other], input, other), other);
  assert.equal(chooseMidiOutput([casio], input, other), casio);
  assert.equal(chooseMidiOutput([through], undefined, through), through);
  const alternate = { ...casio, id: 'second', name: 'CASIO port 2' };
  assert.equal(
    chooseMidiOutput(
      [casio, alternate],
      { ...input, name: 'Unknown Casio' },
      'auto',
    ),
    undefined,
  );
  assert.equal(chooseMidiOutput([alternate], input, 'auto'), alternate);
});

test('global Both demonstrates through MIDI and speakers once; Quiet has no sound', async () => {
  const both = fixture();
  await both.player.hear([...notes], both.output, true);
  assert.equal(both.messages.length, 6);
  assert.equal(both.speakers(), 1);
  both.player.stop();
  assert.equal(both.clears(), 1);
  const quiet = fixture();
  await quiet.player.hear([...notes], undefined, false, true);
  assert.equal(quiet.messages.length, 0);
  assert.equal(quiet.speakers(), 0);
  assert.equal(quiet.state().playing, true);
  quiet.finish();
  assert.equal(quiet.state().playing, false);
});
