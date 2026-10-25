import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultView, parseViewSettings, scoreZoom } from '../src/view';

test('view settings retain valid choices and recover from missing or invalid storage', () => {
  assert.deepEqual(parseViewSettings('{"size":"compact","multiline":true}'), {
    size: 'compact',
    multiline: true,
  });
  for (const raw of [
    null,
    '',
    'broken',
    'null',
    '[]',
    '{"size":"huge","multiline":"yes"}',
  ]) {
    assert.deepEqual(parseViewSettings(raw), defaultView);
  }
  assert.ok(scoreZoom.kid > scoreZoom.compact);
  assert.ok(scoreZoom.compact > 1.25);
});
