# Kidmidi

Long-term direction lives in `docs/product-direction.md`: playful experiences
for toddler co-play and older children, teacher-informed folk/public-domain
repertoire, an extensible MIT core, optional accounts and portable local data.
Keep future support payments separate from earned game currency. The code license
does not establish rights to bundled songs, arrangements or artwork.

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
Auto-select named MIDI inputs ahead of known virtual routing/blank ports; preserve
explicit manual selections and preferred-keyboard reconnect behavior.

Run `npm run typecheck`, `npm test`, `npm run check`, and `npm run build`.
Add or update focused regression coverage for behavior changes and bug fixes.
Keep the full Node test suite under about 10 seconds on a normal development
machine or cached CI runner. Prefer deterministic inputs and fake clocks over
real-time waits; investigate slowdowns without dropping meaningful coverage.
For browser-dependent changes run `npm run test:browser` using bundled Playwright
Chromium; visually inspect desktop and phone layouts for presentation changes.
Mocked MIDI checks do not establish physical keyboard compatibility.
Keep build/test output, recordings, credentials and local state out of Git.
Tracked downloadable scores are maintained generated assets: run
`npm run scores:export` when their source changes and commit the updated scores.
Update README.md and relevant `docs/` specifications when behavior changes.

Keep main-push deployment fast: lint, Node unit tests and the typechecked build
run in the single Pages job. Browser tests and the Pages bundle smoke check belong
in the separate manual Browser checks workflow; do not add them back to every
main push without an explicit request. Aim for about 10 seconds for the combined
lint, Node tests and build on a cached runner, excluding setup and deployment.
Keep browser checks bounded too; avoid unnecessary waits and repeated full runs.

Inspect Git status before editing, preserve unrelated changes, and commit only
task-related files. Review the final diff and complete required checks before pushing.
Commit and push completed changes to the current branch by default, unless the
user explicitly asks otherwise. Pushes to main deploy the public site. After
pushing, monitor the Pages workflow for that commit and address failures caused
by the change. Report the commit, validation and deployment result; explicitly
state if deployment could not be verified.
