# Just explore: live notation

Just explore writes MIDI, on-screen piano, and computer-keyboard playing into a
running MusicXML score. This is deliberately loose notation for experimenting.
The user requested a convenient 4/4 default rather than strict timing or meter
inference. Practice songs still use their existing target-matching behavior.

## Capture and interpretation

`src/explore.ts` keeps source attacks with stable IDs, source/channel/pitch input
identity, pitch, velocity, onset and release times. Web MIDI uses the message's
DOM high-resolution timestamp; other inputs use the same performance clock.
Snapshot copies are immutable to consumers. Duplicate note-ons while a key is
held are ignored; new attacks after release remain separate notes. Losing focus,
changing inputs or unplugging finishes held source notes without deleting the take.

The displayed interpretation is separate from this raw capture:

- Attacks within 80ms of a group's first attack form a chord. Repeated pitches
  always begin a new group, even when they are close in time.
- A quarter note is provisionally 500ms. Ordinary attack spacing sets approximate
  eighth/quarter/half/whole values. For a pause of 1600ms or more, use the previous
  key-hold duration instead. The last held group initially appears as a quarter
  and gets its approximate value on release or the next attack.
- Silent gaps are omitted. Pausing to find a key never creates a run of rests.
  There is no tempo or meter inference, metronome, or timing score.
- Sequential note/chord groups fill convenient 4/4 bars. Notes crossing barlines
  are split with notated and playback ties; trailing rests complete the last bar.
  Added rests are formatting padding, not detected performance silence.
- Chord tones share the group's approximate duration. This does not reconstruct
  independent overlapping voices or pedal sustain. Raw release times remain
  available in the in-memory take for future interpretation.
- Pitches are preserved, spelled with sharps where needed, without key inference.
  Below-middle-C pitches add a bass staff. This fixed staff split is a readability
  choice, not inferred hand assignment. Near-simultaneous notes are beamed/grouped
  by the engraver where appropriate; no harmony labels are invented.

## Display and lifecycle

The normal view shows the last two bars; Multiline shows the last eight. The
complete take remains downloadable as MusicXML. This bounds live engraving work
as a performance grows. The cursor follows the latest note/chord (including a
continuation if it crosses a bar); rests are never colored as played notes.
Compact/Kid sizes, horizontal panning, and multiline following use the shared
score renderer. A blank 4/4 staff appears before the first note.

Clear recording resets only the explore take. Switching to a song and returning
keeps it; reloading discards it. Up to 512 source attacks are retained. At that
limit the piano still plays, capture stops, and the page explicitly offers
clearing/downloading. There is no recording upload, account, or background audio
capture. The current MIDI CC64 limitation also applies to free play.

## Validation

Node tests cover immutable capture, timestamps, repeated attacks, chord grouping,
long pauses, 4/4 duration totals per voice, tied continuations, grand-staff pitch
preservation, full-download versus rolling-view counts, empty scores, and the
recording bound. Source attack counts exclude rests and tied continuations.

One browser integration exercises actual MIDI event routing into an engraved
three-note chord, repeated note, bass staff, MusicXML XML parsing/export, display
settings and clearing. Desktop and phone renders are visually reviewed for
clefs, accidentals, stems, ties, chord grouping, clipping and latest-note focus.
The fast main-push pipeline remains unchanged; browser checks stay separate.
