import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advance,
  musicXml,
  parseMidi,
  songs,
  startPosition,
} from '../src/music';

test('MIDI channels, note off, velocity zero, and unrelated messages', () => {
  assert.deepEqual(parseMidi([0x92, 60, 100]), {
    type: 'on',
    note: 60,
    velocity: 100,
    channel: 2,
  });
  assert.equal(parseMidi([0x90, 60, 0])?.type, 'off');
  assert.equal(parseMidi([0x82, 60, 64])?.type, 'off');
  for (const message of [[0xb0, 64, 127], [0xf8], [0x90, 60], [0x90, 150, 90]])
    assert.equal(parseMidi(message), null);
});

test('waits for the correct pitch, advances phrases and completes each song', () => {
  for (const song of songs) {
    let position = startPosition();
    assert.equal(advance(song, position, 1), position);
    const all = song.phrases.flat();
    for (const [index, note] of all.entries()) {
      position = advance(song, position, note.midi);
      assert.equal(position.complete, index === all.length - 1);
    }
    assert.equal(advance(song, position, 60), position);
  }
});

test('all phrases have complete bars in their own meter and one score note per target', () => {
  for (const song of songs) {
    for (const phrase of song.phrases) {
      const beats = phrase.reduce((sum, note) => sum + note.beats, 0);
      const beatsPerBar = song.timeSignature?.beats ?? 4;
      assert.equal(beats % beatsPerBar, 0);
      const xml = musicXml(phrase, song);
      assert.equal((xml.match(/<note>/g) ?? []).length, phrase.length);
      assert.equal((xml.match(/<measure /g) ?? []).length, beats / beatsPerBar);
    }
  }
});

test('rain transcription preserves source rhythm, key, lyrics, harmony and ending', () => {
  const rain = songs.find((song) => song.id === 'rain');
  assert.ok(rain);
  const notes = rain.phrases.flat();
  assert.equal(notes.length, 45);
  assert.equal(notes.filter((note) => note.beats === 0.5).length, 42);
  assert.equal(notes.filter((note) => note.beats === 1).length, 3);
  assert.deepEqual(
    notes.slice(0, 7).map((note) => [note.midi, note.beats]),
    [
      [69, 0.5],
      [67, 0.5],
      [66, 0.5],
      [64, 0.5],
      [66, 1],
      [62, 0.5],
      [62, 0.5],
    ],
  );
  assert.deepEqual(
    notes.slice(-3).map((note) => [note.midi, note.beats]),
    [
      [62, 0.5],
      [66, 0.5],
      [62, 1],
    ],
  );
  const xml = musicXml(notes, rain);
  assert.match(xml, /<fifths>2<\/fifths>/);
  assert.match(xml, /<beats>2<\/beats><beat-type>4<\/beat-type>/);
  assert.equal((xml.match(/<measure /g) ?? []).length, 12);
  assert.equal((xml.match(/<harmony /g) ?? []).length, 13);
  assert.equal((xml.match(/new-system="yes"/g) ?? []).length, 3);
  assert.match(xml, /<syllabic>middle<\/syllabic><text>tröpf<\/text>/);
  assert.match(xml, /<text>ded<\/text>/);
  assert.match(xml, /<text>det<\/text>/);
  assert.match(xml, /<text>d Blüem<\/text>/);
  assert.match(xml, /<bar-style>light-heavy<\/bar-style>/);
  assert.doesNotMatch(xml, /<beam/);
  assert.equal(notes.filter((note) => note.midi === 66).length, 9);
});
