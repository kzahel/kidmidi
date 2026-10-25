# Kidmidi

Read README.md first. This is a small website-first TypeScript piano playground
for young children and parent co-play. Preserve the patient, pitch-only practice
loop: correct fresh note-on is accepted immediately, wrong notes wait, no timed
scoring or punishment. Presentation lingers on a hit through its note-length/key
hold; accept an early next correct note without forcing a pause. Keep recognition
and feedback lifetime separate. Next-note cues are idle hints only: suppress them
during playing/holds and wait for a pause before helping. Preserve readable staff
sizes; use score scrolling and follow the played note instead of squeezing glyphs.
Compact/Kid sizing and multiline are independent saved display preferences.

Keep MIDI transport separate from practice and song data so native Android/iOS
adapters can follow later. Score targets use MusicXML; live MIDI is performance
input. No transcription pipeline is needed for the current scope.

Run `npm run typecheck`, `npm test`, `npm run check`, and `npm run build`.
For browser-dependent changes run `npm run test:browser` using bundled Playwright
Chromium. Mocked MIDI checks do not establish physical keyboard compatibility.
Keep generated output, recordings, credentials and local state out of Git.
