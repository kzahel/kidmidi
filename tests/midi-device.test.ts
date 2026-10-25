import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseMidiInput, parseMidiPreference } from '../src/midi-device';

const casio = { id: 'casio', name: 'CASIO USB-MIDI', manufacturer: 'Casio' };
const other = { id: 'other', name: 'Other MIDI', manufacturer: 'Other' };

test('MIDI preference parsing tolerates unavailable or corrupt browser storage', () => {
  assert.deepEqual(parseMidiPreference(JSON.stringify(casio)), casio);
  for (const raw of [null, 'broken', 'null', '{}', '{"id":"x","name":5}'])
    assert.equal(parseMidiPreference(raw), null);
});

test('input selection restores a preferred port, permits fallback and handles changed IDs without guessing among duplicates', () => {
  assert.equal(chooseMidiInput([other, casio], casio, 'other'), casio);
  assert.equal(chooseMidiInput([other], casio, ''), other);
  assert.equal(chooseMidiInput([], casio, ''), undefined);
  const renamedId = { ...casio, id: 'new-casio-id' };
  assert.equal(chooseMidiInput([other, renamedId], casio, 'other'), renamedId);
  const duplicate = { ...casio, id: 'second-casio-id' };
  assert.equal(
    chooseMidiInput([other, renamedId, duplicate], casio, 'other'),
    other,
  );
  assert.equal(chooseMidiInput([other, casio], null, 'casio'), casio);
});

test('automatic selection avoids Through and blank ports, including old saved defaults and hotplug', () => {
  const through = {
    id: 'through',
    name: 'Midi Through Port-0',
    manufacturer: 'ALSA',
  };
  const blank = { id: 'blank', name: '', manufacturer: null };
  assert.equal(chooseMidiInput([through, casio], null, ''), casio);
  assert.equal(chooseMidiInput([through, casio], through, 'through'), casio);
  assert.equal(
    chooseMidiInput(
      [through, casio],
      { ...through, selection: 'automatic' },
      'through',
    ),
    casio,
  );
  assert.equal(chooseMidiInput([blank, casio], blank, 'blank'), casio);
  assert.equal(chooseMidiInput([through], null, ''), through);
  assert.equal(chooseMidiInput([through, casio], null, 'through'), casio);
  assert.equal(chooseMidiInput([through], casio, ''), through);
  assert.equal(chooseMidiInput([through, casio], casio, 'through'), casio);
  assert.equal(
    chooseMidiInput(
      [through, casio],
      { ...through, selection: 'manual' },
      'casio',
    ),
    through,
  );
  assert.deepEqual(
    parseMidiPreference(JSON.stringify({ ...through, selection: 'manual' })),
    { ...through, selection: 'manual' },
  );
});
