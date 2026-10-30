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

## Musical companion discoveries

`companion-dance.ts` owns a bounded, ephemeral memory of up to eight live attacks.
`usePianoSession` feeds it only fresh Free play note-ons after audition, calibration,
MIDI-echo and duplicate-held-input routing. Note releases never create steps.
Imported/restored recordings and playback do not feed discovery. The companion
continues its ordinary listening sway during playback.

Every live attack restarts a 550ms hop. Pitch direction changes the lean, and a
run of rising semitone/tone steps lifts the hop in four small increments. There
is no velocity, rhythm, speed or musical-quality score. A pause longer than ten
seconds starts a new musical phrase. Distinct notes in an 80ms attack group are
chords rather than melodic patterns; a fresh repeated pitch starts another group,
matching capture's grouping boundary without sharing or mutating recorder state.

| Played shape                                                 | Pet discovery |
| ------------------------------------------------------------ | ------------- |
| Eight-note major or natural minor scale, ascending           | Scale flip!   |
| The same scale descending                                    | Backflip!     |
| Four fresh attacks on one pitch                              | Echo hops!    |
| Five alternating attacks on two distinct pitches (A B A B A) | Twirl!        |
| A major/minor arpeggio through the octave, either direction  | Star spin!    |
| A leap of exactly one octave, either direction               | Octave leap!  |
| Six chromatic notes in one direction                         | Tiptoe!       |

Scales and arpeggios use relative intervals, so transposition and other octaves
work. Discoveries consume their matched phrase, keeping the last pitch as a new
start. A 1.4-second trick finishes even if more input arrives; capture and musical
memory continue, while ordinary hops cannot cut the trick short. A special move
is a local visual response, not a badge or a purchase, and can be found again.

The dance uses the existing companion dock with a bounded stage. Jumps, spins
and flips keep the score, piano, keyboard controls and viewport geometry fixed.
Reduced motion disables all movement while keeping the discovery caption and
symbols. A discovery caption is announced as a status; individual hops are not.
Reset/new recording, visual Clear page, navigation, profile/settings entry,
focus loss, unplugging and playback loading cancel pending tricks and phrase
memory. Component teardown cancels its timer. No discovery state is persisted or
uploaded, and wallet, curriculum, practice recognition and recording timestamps
remain independent.

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

Playback uses captured note timing, overlaps and velocity through the
[global sound destination](sound-playground.md): Screen uses the current synthesized
voice, Keyboard uses the selected MIDI output, Both uses both, and Quiet stays
silent. Auto chooses a matching MIDI output or falls back to Screen. The live staff
and piano follow playback without generating captured events. Stop, live input,
leaving Explore, blur/visibility changes and loading/new sessions cancel playback
and release its voices. Playback scheduling only visits the currently due notes;
it does not create oscillators for an entire long recording in advance. Outgoing
MIDI note echoes are filtered before capture; sound-setting auditions never enter
the take. Recordings retain notes and timing, and are replayed with the current
sound rather than embedding a sound preset in the recording file.

## Validation

Node dance coverage checks transposed/descending scales, other motifs, chords,
contour following, slow playing, interruptions and timer cleanup using a fake
clock. Browser journeys check actual live dance triggers, duplicate held inputs,
continued capture, unchanged wallets, playback isolation, interruptions, reduced
motion and sampled flip geometry on desktop and phones.

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
