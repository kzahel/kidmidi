import assert from 'node:assert/strict';
import test from 'node:test';
import {
  closeKeyRange,
  defaultKeyRange,
  keyboardLayout,
  keyboardProfile,
  parseKeyboardSettings,
  saveKeyboardProfile,
} from '../src/keyboard';

test('keyboard layout preserves pitches and proportions across close, full and black-key endpoints', () => {
  assert.equal(keyboardLayout(closeKeyRange).keys.length, 25);
  assert.equal(keyboardLayout(defaultKeyRange).whiteCount, 36);
  for (const range of [
    defaultKeyRange,
    { low: 21, high: 108 },
    { low: 37, high: 85 },
    { low: 0, high: 127 },
  ]) {
    const layout = keyboardLayout(range);
    assert.equal(layout.keys.length, range.high - range.low + 1);
    assert.equal(layout.keys[0].note, range.low);
    assert.equal(layout.keys.at(-1)?.note, range.high);
    for (const key of layout.keys) {
      assert.ok(key.left >= 0 && key.left + key.width <= 100.00001);
      assert.ok(
        Math.abs((key.width * layout.units) / 100 - (key.black ? 0.6 : 1)) <
          0.00001,
      );
    }
  }
  const close = keyboardLayout(closeKeyRange);
  assert.equal(close.keys.find((k) => k.note === 60)?.left, (7 / 15) * 100);
});

test('keyboard settings recover from invalid storage and retain separate ranges per input', () => {
  const defaults = { zoom: 'close', profiles: [] };
  for (const raw of [
    null,
    '',
    'broken',
    'null',
    '[]',
    '{"zoom":"no","profiles":[null,{"id":"broken","low":-1,"high":200}]}',
  ])
    assert.deepEqual(parseKeyboardSettings(raw), defaults);
  const casio = { id: 'casio', name: 'My Casio', manufacturer: 'Casio' };
  const other = { id: 'other', name: 'Other keyboard', manufacturer: null };
  let settings = saveKeyboardProfile(parseKeyboardSettings(null), casio, {
    low: 36,
    high: 96,
  });
  settings = saveKeyboardProfile({ ...settings, zoom: 'all' }, other, {
    low: 21,
    high: 108,
  });
  assert.deepEqual(parseKeyboardSettings(JSON.stringify(settings)), settings);
  assert.equal(keyboardProfile(settings.profiles, casio)?.low, 36);
  assert.equal(keyboardProfile(settings.profiles, other)?.low, 21);
  const replugged = { ...casio, id: 'new-id' };
  assert.equal(keyboardProfile(settings.profiles, replugged)?.high, 96);
  settings = saveKeyboardProfile(settings, replugged, { low: 48, high: 84 });
  assert.equal(settings.profiles.length, 2);
  assert.equal(keyboardProfile(settings.profiles, replugged)?.low, 48);
  assert.equal(
    keyboardProfile(
      [...settings.profiles, { ...casio, id: 'duplicate', low: 36, high: 96 }],
      {
        ...casio,
        id: 'unknown',
      },
    ),
    undefined,
  );
});
