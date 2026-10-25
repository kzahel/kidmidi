# Just explore: fixed live notation and saved recordings

Explore accepts MIDI, on-screen piano and computer-keyboard attacks. Capture,
live presentation, full notation export and playback have separate responsibilities.
Practice targets and Note hunt scoring remain independent.

## Capture

`ExploreRecorder` retains every source attack with an ID, source/channel/pitch
identity, pitch, velocity, onset/release timestamps and an explicit chord-group
index. Duplicate held note-ons are ignored; fresh repeated pitches remain separate
attacks. Notes within 80ms form a chord unless that pitch is already in the group.
Releases, unplugging, focus loss and input changes finish held notes without
removing the recording. Range calibration consumes its setup notes before capture.

There is no application note-count cutoff. The complete active session stays in
memory as a fallback; the live UI receives only the latest 32 groups, so longer
sessions do not increase per-key engraving work. Resuming a loaded session appends
new input 500ms after its previous end, translating the new page's performance
clock into that session's timeline. An interrupted held note restores with a
300ms fallback duration. CC64/pedal interpretation is still unsupported.

## Fixed staff

The previous MusicXML live view re-engraved, resized and respaced after every
attack. `ExploreScore` now reserves the complete grand staff before input, using
VexFlow directly (the version already present through OSMD, now a direct pinned
dependency). The same SVG/staves remain mounted while a note layer fills in.

- Width and Compact/Kid preference choose one to four measures per row. Multiline
  can reserve a second row when height allows. Only resizing or changing display
  preferences rebuilds the grid, never new notes or releases.
- Each measure has four fixed quarter-note positions. One attack group occupies
  one slot, including chords spanning both staves. Earlier notes keep their exact
  positions; there is no continuous panning, duration-driven spacing or new staff
  appearing when the first bass note arrives.
- A full page wipes visually on the next group. The recording and cumulative note
  count continue. Clear page starts a fresh group/page without deleting any notes.
- Live symbols intentionally use quarter notes, independent of performed length.
  MIDI pitches are preserved in capture/export; below C4 goes to the bass staff.
  Pitches outside C2–C7 are displayed in a nearby octave with an explicit actual
  pitch/arrow label, preserving a fixed layout even at extreme MIDI pitches.
- Empty hands/beats stay blank; no rests are drawn in the live staff.
- Newest noteheads are green. The piano continues to show physically held notes.
  The whole drawing fits the viewport without scrolling or layout animation.

## Export interpretation

Full MusicXML export runs on request, not on each key. It retains the earlier
loose transcription: a provisional quarter is 500ms, gaps under 1600ms select a
nearby eighth/quarter/half/whole duration, and longer pauses use key-hold duration
instead of a wall of rests. Sequential groups fill 4/4 bars with ties across
barlines and invisible padding rests (`print-object="no"`). These preserve voice
durations without adding rest symbols to otherwise silent staff space. Low notes add a bass staff. Chord tones share an
approximate duration; separate hands/voices/tempo/meter are not inferred. Sharps
spell chromatic pitches. The export is editable notation, not an exact timing
reconstruction; raw recording JSON retains performance timing separately.

## Saving and controls

`RecordingLibrary` stores metadata and individual notes in IndexedDB
`kidmidi-recordings`. Changed attacks/releases are batched roughly every 200ms in
atomic note/metadata transactions. A continuous performance does not postpone
saving until a pause, and old notes are not serialized again for each key.
Visibility loss/pagehide and Save flush pending writes. Browser termination can
still interrupt an in-flight save; the Saved indicator reflects completed writes.
No recording data is uploaded.

- The most recently changed saved session restores on reload if playing has not
  already started. Late restoration/loading cannot replace new live input.
- New recording archives the previous take and starts fresh. Clear page only
  clears the drawing. Neither is the Delete operation.
- Recordings offers Load, Play, Download recording (versioned JSON), Open recording
  file and MusicXML. Import validates data, normalizes IDs and creates a new session;
  it does not overwrite the source recording. Imports are bounded to 100MB/500k
  notes for responsiveness; live recording has no fixed note-count limit.
- Delete asks for a second explicit click in the menu and removes that saved
  session and its notes. Download is the portable backup/transfer mechanism.
- Save failures are visible, with the active session retained in memory and
  unsaved sessions retained for download. Storage is local to this browser/origin;
  it is not a cloud backup or synchronized account.

Playback uses captured note timing, overlaps and velocity with a simple local
synthesized voice; it does not send notes to the physical keyboard. The live staff
and piano follow playback without generating captured events. Stop, live input,
leaving Explore, blur/visibility changes and loading/new sessions cancel playback
and release its voices. Playback scheduling only visits the currently due notes;
it does not create oscillators for an entire long recording in advance.

## Validation

Node coverage checks immutable capture, repeated/chord attacks, explicit page
breaks within a chord window, unchanged slot positions, page wrapping, bounded UI
snapshots past the old capture limit, resumed clocks/IDs, recording-file parsing,
full MusicXML pitch/rhythm/ties and an unavailable-storage fallback.

One browser boundary exercises real mocked MIDI into chords/bass and full XML
export. Another verifies unchanged SVG identity/geometry and first-note position
as a page fills, visual-only clears, IndexedDB reload recovery, archive/load,
portable JSON round trip, timed playback/highlights without re-recording, deletion
and phone fit. Existing practice/game/keyboard tests remain the regression suite.
Desktop/phone fixed staves and the recording menu are visually reviewed with
bundled Playwright Chromium. Main-push CI stays fast; browser checks remain separate.
