# Piano range and zoom

The initial close view shows C3–C5 on desktop and C4–C5 on small touch layouts,
centered around middle C. The full view shows every semitone in the configured keyboard range, using narrower keys. Both views
fit within the viewport without horizontal scrolling. Middle C has a distinct
label, and phone full views omit non-C labels to limit crowding. Compact/Kid size
still sets the maximum key width; the layout preserves white/black proportions.

## Establishing the range

[Web MIDI's MIDIPort interface](https://www.w3.org/TR/webmidi/#midiport-interface)
provides identity, name and manufacturer, without a keyboard key-count or pitch-
range property. Do not label a guessed range as hardware-detected capabilities.
The initial assumption is 61 keys from MIDI 36 to 96 (C2–C7), based on the owner's
description. An 88-key A0–C8 preset is also available.

Range setup can capture exact endpoints: play the lowest physical key and then
the highest. The second must be above the first; invalid attempts retain the
first endpoint and prompt again. Setup consumes those MIDI note-ons so they
cannot progress songs, earn game points or enter an explore recording. The
physical piano still supplies its own sound. Starting setup releases any held
application notes; cancelling or changing MIDI inputs clears unfinished setup.
Black-key endpoints are supported, with small gutters to display those keys
fully without inventing extra playable notes outside the range.

An ordinary MIDI attack outside the range expands its lower/upper bounds. This
is evidence of another playable pitch, not proof of the physical endpoints;
transposition may change the emitted range. Pointer/computer input never changes
a physical keyboard's range. Zooming preserves held MIDI notes and highlights.
Close view remains centered even when MIDI notes arrive outside its displayed
octave(s); switching to full view reveals those keys, and the score/readout still receives all notes.

## Storage and validation

`kidmidi.keyboard.v1` stores the zoom choice and at most 32 input profiles in this
browser. Exact port ID wins; a unique name/manufacturer match can restore a range
if the ID changes. Ambiguous names use the default rather than another keyboard's
profile. The disconnected on-screen keyboard has its own profile. Invalid or
unavailable local storage falls back to the default; input remains usable.

`src/keyboard.ts` owns parsing, profile matching and key geometry. `useKeyboard`
owns range observation and endpoint capture; `usePianoSession` routes only MIDI
attacks into it, before practice/explore/game processing. Node tests check pitch/count/geometry
for close, full, 88-key, black-endpoint and MIDI-wide ranges, plus persistence and
identity matching. One browser boundary test checks held notes across zoom,
calibration isolation, range expansion, multiple inputs, reload and phone fit.
The existing browser suite exercises score fitting and game/explore regressions.
Desktop close/full and phone 61/88-key views were visually checked with bundled
Playwright Chromium. Actual physical endpoints still require the owner's setup.
