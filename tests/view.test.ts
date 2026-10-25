import assert from 'node:assert/strict';
import test from 'node:test';
import {
  defaultView,
  fitScore,
  parseViewSettings,
  practicePage,
  scoreZoom,
} from '../src/view';

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

test('score fit preserves aspect ratio, stays bounded and never enlarges past its target size', () => {
  for (const [width, height] of [
    [1200, 300],
    [400, 600],
    [800, 120],
    [0, 0],
  ]) {
    const fit = fitScore(900, 700, width, height);
    assert.ok(fit.width <= width && fit.height <= height);
    assert.ok(fit.scale >= 0 && fit.scale <= 1);
    assert.equal(fit.width, 900 * fit.scale);
    assert.equal(fit.height, 700 * fit.scale);
  }
  assert.equal(fitScore(500, 200, 1000, 800).scale, 1);
});

test('practice pages follow the current phrase and use fewer phrases on smaller screens', () => {
  assert.deepEqual(practicePage(6, 3, true, 'kid', 1280, 900), {
    index: 1,
    count: 3,
    start: 2,
    end: 4,
  });
  assert.deepEqual(practicePage(4, 2, true, 'kid', 844, 390), {
    index: 2,
    count: 4,
    start: 2,
    end: 3,
  });
  assert.deepEqual(practicePage(4, 0, true, 'compact', 1280, 900, 99), {
    index: 1,
    count: 2,
    start: 2,
    end: 4,
  });
  assert.deepEqual(practicePage(4, 3, false, 'kid', 1280, 900), {
    index: 3,
    count: 4,
    start: 3,
    end: 4,
  });
});
