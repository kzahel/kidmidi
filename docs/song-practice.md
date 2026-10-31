# Patient song practice and played-note ghosts

Song practice accepts a fresh note-on matching the current MusicXML melody pitch
immediately. Misses wait at that position. Note duration, key hold and a release
tail control presentation separately from recognition; an early next correct note
always takes over. There is no timed scoring or reward deduction.

## Compare a played note with the target

A missed attack adds one blue-grey ghost at 50% opacity to the existing song
staff. Its notehead shares the waiting target's horizontal position and uses the
played pitch's vertical staff position. The printed target remains in place, so
the child can compare the two heights while trying nearby keys. A sharp or a
natural cancelling the song key signature disambiguates pitches that occupy the
same staff position. The score's accessible description also identifies the
played/target pitches and whether to try higher or lower.

The most recent miss replaces the previous ghost; there is no accumulating trail.
Key release and idle time leave it available for comparison. The next correct
attack clears it and uses the existing green success feedback. Held duplicate
note-ons cannot produce attempts. MIDI, on-screen and computer keys use the same
input path. Ghosts are played feedback and remain available with Idle hints off;
next-note cursor/key hints still wait for inactivity.

Pattern lessons reuse this ghost renderer and the same held-note/idle feedback
controllers. Their Options menu shares the song Idle hints setting for the app
session. The full pattern and its progress checks remain visible; the wrong-note
ghost follows the waiting position independently of the last green hit. See
[Pattern hunt](note-hunt.md#pattern-hunt) for the separate phrase celebrations
and exercise rewards.

Ghosts remember the recognition position at the moment of the attack, independent
of a previous note's lingering green feedback. If that position is on another
printed page, the ghost waits for its page to appear. Browsing another page hides
it there; returning restores it. Normal feedback still controls automatic page
changes. A miss never advances or reflows the song. Reset, song/activity changes,
settings/profile entry, blur, visibility loss, input changes and disconnecting
clear the ghost along with other live feedback. Loading or playing a
phrase demonstration does not generate attempts.

## Engraving boundary

`played-note.ts` holds pitch-to-staff geometry and accidental policy.
`paint-played-note.ts` adds a small SVG group in the target note's coordinate
system, using the engraved notehead, staff spacing, independent stem and ledger
lines. It does not reload MusicXML, mutate source notes, or change score fitting.
Resizing or changing Compact/Kid and Multiline redraws the overlay against the
new engraving. Reduced motion retains the still ghost.

Very distant input is octave-displaced into the target staff's two-ledger-line
margin, with the actual played pitch and an up/down arrow written beside it.
This keeps the whole score and piano fitted without shrinking the notation or
adding unbounded ledger lines. Current songs spell chromatic pitches as sharps;
ghosts use that same spelling and the song's key signature.

## Validation

Deterministic Node tests cover diatonic staff spacing, semitones, key-signature
naturals and bounded octave displacement throughout MIDI's pitch range. Browser
journeys check exact horizontal alignment, above/below placement, held-note
feedback independence, persistence after release, correction/reset cleanup,
page browsing, re-engraving, accidentals, extreme MIDI input, unplugging, reduced
motion and desktop/phone fit. Mock MIDI verifies routing rather than physical
keyboard compatibility.
