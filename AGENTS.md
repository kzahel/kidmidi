# Kidmidi

Read README.md first. This is a small website-first TypeScript piano playground
for young children and parent co-play. Preserve the patient, pitch-only practice
loop: correct fresh note-on is accepted immediately, wrong notes wait, no timed
scoring or punishment. Presentation lingers on a hit through its note-length/key
hold; accept an early next correct note without forcing a pause. Keep recognition
and feedback lifetime separate. Next-note cues are idle hints only: suppress them
during playing/holds and wait for a pause before helping. Fit the complete displayed
score page and piano within the viewport without scrolling or clipping. Keep
notation as large as space allows; paginate multiline practice and advance pages
with played-note feedback.
Compact/Kid sizing and multiline are independent saved display preferences.

Keep MIDI transport separate from practice and song data so native Android/iOS
adapters can follow later. Practice targets use MusicXML; live MIDI is performance
input. Just explore also turns that input into loose, local notation. Preserve raw
attack/release timestamps separately from approximate displayed durations; do not
introduce audio transcription or a server for this feature. See
`docs/explore-transcription.md`. Keep Explore’s live staff geometry fixed while
playing, independent from MusicXML export. Visual clears/page wraps must retain
the full autosaved recording; playback never feeds capture. Note hunt is a
separate game with attempt-based positive rewards; keep its scoring separate from patient song practice. See
`docs/note-hunt.md`. The piano has close/full views and per-input ranges; MIDI
port identity does not establish a physical key count. See `docs/keyboard-range.md`.

Run `npm run typecheck`, `npm test`, `npm run check`, and `npm run build`.
For browser-dependent changes run `npm run test:browser` using bundled Playwright
Chromium. Mocked MIDI checks do not establish physical keyboard compatibility.
Keep generated output, recordings, credentials and local state out of Git.

Keep main-push deployment fast: lint, Node unit tests and the typechecked build
run in the single Pages job. Browser tests and the Pages bundle smoke check belong
in the separate manual Browser checks workflow; do not add them back to every
main push without an explicit request.

Commit and push completed changes to the current branch by default, unless the
user explicitly asks otherwise.
