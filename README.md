# Kidmidi

A small piano playground for children and parents. Follow a familiar melody at
your own pace: the staff waits until you press the next note. An early experiment,
with Twinkle, Twinkle, Hot Cross Buns, Räge-Rägetröpfli, free play, and Note hunt.

**Play:** https://kzahel.github.io/kidmidi/

Kidmidi is a long-term open platform for playful family music-making, with
experiences that grow from toddler co-play into independent learning. The focus
is folk and public-domain repertoire, informed by family use and experienced
piano-teacher advice. Original software and documentation are [MIT-licensed](LICENSE);
music and third-party artwork have separate rights. The original vector
companion and accessory artwork in `src/Pet.tsx` is included under MIT. Accounts will remain optional if added.
See [product direction](docs/product-direction.md) for age-specific design,
extensibility, portability and possible voluntary support.

The home menu has large activity cards for **Play a song**, **Free play**, and
**Note hunt**. Songs have their own selection screen. **Home** returns to the menu; **← Lessons** stays in the main header during
Note Hunt and Pattern Hunt, including on phones, and returns to the selected group;
the learner button opens profiles, hearts and rewards, and the persistent
sound/gear button opens **Sound and settings** from every activity, including
without a MIDI keyboard. **Sounds**, **Make**, **Output**, and **Keyboard** tabs
keep settings on one screen without scrolling, including on phones. Activity **Options** contains notation size, Multiline
and idle hints. Navigation and utility controls have at least 48px
touch targets. Piano keys retain their musical proportions; **Close** shows one
octave on small screens for wider touch keys, and two octaves on desktop.

Use **Kid** (default, large notation) or **Compact**, and toggle **Multiline** for
pages containing multiple printed line groups when space allows. Layout choices
are remembered in this browser and work independently. The staff, illustration
and piano fit within the screen without scrolling. Kid and Compact set the maximum
notation size; engraving adapts to available width and height. Pages advance with
played-note feedback, and small arrows allow browsing multiline pages. Short or
narrow screens show fewer line groups per page.
The owner confirmed physical Casio USB-MIDI note input on 2026-10-25.

Correct notes bloom green on the staff and light up the piano key, with a small
sparkle and duration indicator. The display lingers for the written note length
(eighth 240ms, quarter 480ms, half 960ms), or as long as the struck key is held,
plus a short release tail. A fresh correct next note can take over immediately;
feedback never imposes a playing speed or rejects an early note. Phrase changes
and completion wait for that final note's feedback. Release, reset, changing songs,
losing focus and unplugging clean up highlights/timers. Reduced motion keeps the
colour feedback without the bloom or sparkle. MIDI sustain-pedal CC64 is not yet
used; held feedback follows key-down/key-up.

During normal playing only struck notes highlight. **Idle hints** adds a faint
next-note cursor, piano-key dot and note name after 1.8 seconds of inactivity.
Over the next six seconds, the cursor strengthens, the notehead and piano key
warm to amber, and the note label becomes clearer. Playing immediately removes
these target cues and restores the green played-note feedback.
Releasing a note removes its glow without immediately highlighting the next;
held keys and active hit feedback suppress hints. Any fresh note, including a
wrong one, restarts the pause. Uncheck Idle hints to keep all target cues off.

## Run

Requires Node 22.12+ (or a current newer LTS) and npm.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5174 in Chrome. Connect the powered-on piano's **USB TO HOST**
port with a data-capable cable. The page requests MIDI access automatically.
Allow the browser's MIDI prompt on first use; with permission already granted,
refreshing connects without clicking a button. **Connect keyboard** remains as a
retry if the browser blocks an automatic request or requires a user gesture.
The browser controls whether its permission grant persists; keep using the same
origin (127.0.0.1 and localhost have separate permissions and preferences).

Automatic input selection prefers named devices over blank inputs and known
virtual routing ports such as MIDI Through Port-0, IAC Driver and loopMIDI. If only
a routing port is present initially, plugging in a keyboard upgrades that default.
Older automatically saved Through defaults are corrected too.

If several inputs are available, choose the piano from the selector in keyboard settings. An explicit
choice always wins, including a deliberately selected virtual input. Its ID,
name, manufacturer and whether it was selected manually are remembered locally. Replugging restores that input;
a temporary fallback does not overwrite the preference. If an ID changes, a
unique matching name/manufacturer can restore the choice. Plugging and unplugging
updates the device list without another permission request. Refreshing an unchanged
port list does not clear held notes. The physical keyboard produces its own sound;
MIDI carries notes, not audio. There is no microphone capture.

You can also tap/click the on-screen piano or use A S D F G H J K for C4 through C5.
**Sound and settings** chooses where live notes, phrase demonstrations and saved
recordings play: **Screen**, **Keyboard**, **Both**, **Quiet**, or **Auto**.
Screen uses this device’s speakers/headphones. Keyboard sends screen/computer keys
and playback to the selected MIDI output; physical piano keys keep their own
sound and are never echoed back to MIDI. Both adds the Screen voice alongside the
piano. Quiet stops app-generated sound. The app cannot silence the piano’s built-in
speakers: turn its volume down for Screen-only or quiet playing. Missing or failed
MIDI output falls back to Screen for screen keys and playback, with a visible status.
Auto uses these defaults: physical keys sound on the piano, screen keys on this
device, and playback uses a matching MIDI output when available.

Pick **🎹 Soft keys, 🫧 Bubble, 🤖 Robot, 👻 Ghost, 🚀 Space, 🔔 Bell, or 🎮 Arcade**
for Screen sound. The **Make** tab offers sine/triangle/square/saw waves, brightness,
pluck/hold, wobble, reverb, attack/release and a pitch swoop, with a live waveform,
envelope picture, randomizer and reset. Try the small piano or connected keys inside
settings without recording or advancing practice. Save up to twelve named emoji
sounds locally. Sound, volume and routing choices persist across activities/reloads;
keyboard output selection lives in the **Keyboard** tab. Presets change the
browser synth; the physical piano keeps its own instrument/volume. See
[global sound and sound playground](docs/sound-playground.md).

**Hear this phrase** follows the global sound route. **Stop preview**, changing
songs/outputs, losing focus or unplugging cancels the demonstration. MIDI input is
paused during a keyboard demonstration so echoed notes cannot advance the song.
Playback uses MIDI channel 1 and the keyboard’s current sound; its volume and receive
settings still apply. See [MIDI phrase playback](docs/midi-phrase-playback.md).
The piano has proportioned keys and stays centered instead of stretching across
a wide screen. **Close · middle C** shows C3–C5 on desktop and C4–C5 on
phones/small landscape screens, with larger touch keys.
**All keys** fits the complete keyboard range on screen, using smaller keys.
The initial full range is 61 keys, C2–C7, matching the owner's keyboard assumption.
**Range ⚙** offers 61/88-key presets or **Play end keys to set range**: play the
physical lowest key, then the highest. These setup notes do not count toward a
song or game. Ranges are remembered per MIDI input; the zoom choice is remembered
for this browser. Received MIDI notes beyond a saved range expand it automatically.
Web MIDI exposes port identity and note events, not the physical key count, so
normal playing cannot establish the endpoints. See [keyboard range behavior](docs/keyboard-range.md).

Web MIDI needs HTTPS or a trusted loopback origin such as localhost. A plain HTTP
LAN URL on an Android phone will not provide MIDI. For phone MIDI testing, serve
the built site over HTTPS (and use a USB host capable phone/adapter). Safari/iOS
Web MIDI is not a supported target; future apps need native MIDI adapters.

## Stack and boundaries

- Vite, React, TypeScript; static site with no backend or accounts.
- OpenSheetMusicDisplay renders MusicXML, showing the hit note during feedback
  and a faint next target only after an idle pause.
- `src/music.ts`: starter songs, MusicXML generation, MIDI parsing, and pitch-only
  practice progression. Durations are displayed, but rhythm is not scored.
- `src/feedback.ts`: note-length/held-key feedback and delayed idle hints, independent of recognition.
- `src/explore.ts`: raw MIDI capture, chord grouping and full MusicXML export.
- `src/ExploreScore.tsx` / `src/live-score.ts`: fixed live staff positions and page windows.
- `src/recordings.ts` / `src/RecordingMenu.tsx`: local session autosave and recording files.
- `src/playback.ts`: performance-timed preview playback, separate from recording.
- `src/hunt.ts` / `src/NoteHunt.tsx`: note-finding rounds, heart rewards and paired staff cards.
- `src/view.ts`: Compact/Kid sizing and saved multiline settings.
- `src/rain.ts`: manually checked songbook transcription and source illustration.
- `src/useMidi.ts`: automatic permission request/reconnect and connection lifecycle.
- `src/midi-device.ts`: saved input preference and deterministic device selection.
- `src/keyboard.ts` / `src/useKeyboard.ts`: close/full piano layout and per-input key ranges.
- `src/audio.ts`: local synthesizer, effects and waveform analysis.
- `src/sound-settings.ts` / `src/sound-output.ts`: saved voices and global sound routing.
- `src/SoundLab.tsx` / `src/DeviceSettings.tsx`: sound playground and global settings.
- `src/phrase-preview.ts`: phrase demonstrations through matched MIDI output or speakers.
- `src/App.tsx` / `src/ActivityMenu.tsx`: app shell and activity navigation.
- `src/usePianoSession.ts` / `src/useExploreSession.ts`: shared transport/input routing and recording lifecycle.
- `src/Piano.tsx`, `src/PracticeScore.tsx`, `src/ActivityControls.tsx`: activity presentation.
- `src/learning.ts` / `src/useHuntSession.ts`: daily review and adaptive Note Hunt sessions.
- `src/lesson-catalog.ts` / `src/curriculum.ts`: editable, versioned lessons and pure badge/deck policy.
- `src/LearningMap.tsx`: labelled, paged lessons and badge progress.
- `src/Companion.tsx`: equipped companion and local playing/success reactions, outside notation and piano keys.
- `src/learners.ts` / `src/learner-repository.ts` / `src/useLearners.ts`: profiles, rewards and asynchronous IndexedDB storage.
- Component-owned `*.module.css`: scoped styles with exact generated typings and unused-class checks.

The Räge-Rägetröpfli song is manually transcribed from the supplied book photo:
all 12 bars, key/time signatures, chord symbols, lyrics, stems, flags and final
barline. Its original illustration appears beside the score. Use **Multiline**
to browse all four printed line groups, **Book photo** for the source, or
**MusicXML** to export. Chords are visual references; practice still matches melody notes only.
See [transcription evidence](docs/transcriptions/raege-raegetroepfli.md).

In **Just explore**, a fixed grand staff reserves its measures before you play.
Notes/chords fill equally spaced quarter-note slots without moving earlier notes.
Phones show one measure; wider screens fit more, and Multiline can reserve another
row. Reaching the end starts a clean visual page while the full recording continues.
**Clear page** also clears only the drawing. **New recording** (↺) archives the
current session and starts a new one.

Recording is automatic and local to this browser. **Save** flushes pending writes;
**Recordings** loads or plays a session, downloads/opens a recording JSON file, or
exports the complete take as MusicXML. The most recently changed session returns
after reload. Playback uses the performed timing, overlaps and velocity through
the global sound route and current Screen voice, with piano highlights, and never
records itself. Live playing stops playback. Download a recording to keep a separate copy or transfer devices.
There is no 512-note capture limit. See [live notation and recording behavior](docs/explore-transcription.md).

**Note hunt** opens **Lessons**, a labelled browser with **Find notes**, **Read
notes**, **Patterns**, and **Coming soon** groups. Choose any implemented lesson
immediately, including Quick and patterns: no earlier badge or heart purchase is
required. Cards show the pitch range, name support, set length, and **Ready to
play** or **Badge earned**. Pages show four cards, or two on short phones;
Back/More buttons reveal the rest without scrolling. Returning from a lesson
reopens its group. Pets are companions and rewards, not lesson levels.

Find notes (Garden) has C/E/G, C–G and C–C lessons with names. Read notes
(Treehouse) revisits those ranges without names; tap **💡** for help. Its optional
**Quick** challenge measures fluent finds without a countdown or deadline.
Patterns (River) has **Step up**, **Step down**, **Skip a key**, and **Out and back**.
Each shows an entire three- or five-note shape on the staff, with progress checks
as you play. Notes within a pattern connect freely; a wrong note waits at that
position. The completed pattern lingers while keys are held, then for 1.6 seconds
after release, just like individual Note Hunt cards. Rhythm is not scored.
Bass clef, mixed clefs, accidentals, key signatures and simultaneous notes are
labelled Coming soon, separate from playable lessons.

Single-note lessons visit every note twice. Pattern lessons visit each of two
written shapes twice. Badges require a complete set, at least 80% first-try finds
and one for every pitch; reading badges require those finds without help.
Pattern badges also require the complete written sequences, and do not establish
independent single-note reading. The optional Quick badge adds a four-second
response threshold. New badges give gems once; replaying always earns hearts.
Garden and Patterns pay 3/2/1 hearts by attempt, Treehouse pays 6/4/2, and Quick
pays 9/6/3. Long pauses never reduce those rewards. See the
[curriculum and editing guide](docs/learners-and-curriculum.md).

**Free practice** keeps the original relaxed game available. Its **My learning
path** starts with C4/E4/G4, reviews earlier learning days and adds white notes
after consistent first-try success across multiple days. C/E/G, C–G and C–C can
also be selected manually. This adaptive practice suggestion does not restrict
lesson access. Practice earns the usual hearts indefinitely. Practice and
single-note lessons show the target beside the played note, give higher/lower
cues, and preserve their existing held-key/1.6-second feedback pacing. The
prominent **← Lessons** header button returns to the overview. MIDI, touch and computer
keys work. See [Note hunt behavior](docs/note-hunt.md).

**Learners & rewards** opens a fitted, paged collection with **Rewards**,
**Learners**, and **Progress** tabs. Rewards has **Friends** and **Dress up**:
preview companions and outfits without spending, then explicitly buy or choose.
Original illustrated fox, cat, bunny and puppy companions follow the selected
learner through the home screen, song selection and lesson browser. During songs,
Note Hunt, Pattern Hunt and Free play, your equipped friend has a visible spot
beside the piano (above the keys on phones), wearing the same accessories. It
sways while notes sound and cheers for correct song notes and completed hunt
cards/patterns. Those reactions never affect recognition, pacing or rewards. A bow, star necklace, teal scarf, daisy and
golden crown offer different outfits. The preview, collection cards and equipped
companion use the same artwork. New equipment gives a small greeting; reduced
motion disables movement and blinking. Pages show two rewards with Back/More
controls, keeping the shop and profile/progress tabs within one screen.

Each learner keeps their own history, lifetime hearts, badges, purchases, and
separate heart/gem wallets. The fox is free. Hearts buy permanent friends and
accessories; **3 gems** buy the puppy. The shop shows what is owned/equipped,
prices and how much currency is still needed. Trying something on never equips
it or changes the wallet. Existing friends, accessories and earlier world
purchases stay saved. Spending never removes badges. Profiles and completed
rounds persist in local IndexedDB; device settings and the Explore recording
library stay separate. A failed progress save offers retry and retains the
pending award in that tab. There are no accounts, sign-in or cross-device sync.
See [learning policy and hosted-account direction](docs/learners-and-curriculum.md).

Rhythm is approximate, with no inferred tempo, meter or hand independence.
There is no audio transcription or automatic MIDI-file/photo import.
Song position and unfinished lesson sets/current game rounds reset on refresh;
completed finds, badges, gates, wallets, rewards and Explore recordings persist locally.
There are no analytics, uploads, or external page assets. The first local install
requires the network.

## Validate

```sh
npm run typecheck
npm test
npm run check # Biome, Stylelint, CSS scope/usage and exact typings
npm run build
npx playwright install chromium # first time only
npm run test:browser
```

Keep the full Node test suite (`npm test`) under about 10 seconds on a normal
development machine or cached CI runner. Use deterministic inputs and fake clocks
instead of real-time waits where possible, and keep regression coverage focused.

After changing stylesheet classes, run `npm run styles:write` to refresh tracked
exact module typings. `npm run check` rejects unused or missing classes, unscoped
selectors, stale typings and CSS errors; `npm run typecheck` also checks the style
contract. Document sizing/reset is scoped to an explicitly mounted document class.

Browser checks use Playwright's separate Chromium and simulated MIDI messages.
If another project uses port 5174, run `KIDMIDI_TEST_PORT=5198 npm run test:browser`
to start a separate Kidmidi server without disturbing it.
They cover real staff rendering/cursor progression, repeated notes, unplugging,
on-screen input, completion, and a phone viewport. Physical MIDI requires an
explicit manual keypress check on the actual keyboard.

## GitHub Pages

The public repository is https://github.com/kzahel/kidmidi. Every push to `main`
runs `.github/workflows/pages.yml`: cached dependency installation, Biome lint/
format checks, Node unit tests, then the production build (which includes
TypeScript and downloadable-score freshness checks), and GitHub Pages deployment.
Everything runs in one job to avoid another runner/queue handoff; no browser
installation or browser suite blocks a push. You can also deploy manually from
Actions. Dependency audit/funding network calls are skipped during installation.
Aim for about 10 seconds for the combined lint, Node tests and build on a cached
runner; runner setup, dependency installation and Pages deployment add overhead.

The full browser suite and built project-path smoke check remain available locally
and through the separate **Browser checks** manual Actions workflow
(`.github/workflows/browser-checks.yml`). Run that after renderer/input changes or
when investigating browser behavior. It does not gate the fast Pages deployment.
Pages uses the **GitHub Actions** publishing source and the `github-pages`
environment. No deploy credentials or external hosting are required.

After pushing changes to `main`, verify the Pages workflow for that commit and
report its deployment result. Agent workflow instructions live in [AGENTS.md](AGENTS.md);
`CLAUDE.md` imports that same file.

CI sets `KIDMIDI_BASE_PATH=/kidmidi/`; local development keeps `/`. Asset links,
the songbook illustration, MusicXML download and lazy notation renderer follow
that base path. To reproduce the deployment build locally:

```sh
KIDMIDI_BASE_PATH=/kidmidi/ npm run build
npm run smoke:pages
```

The smoke runner starts and stops its own preview server and bundled Chromium.
GitHub Pages serves HTTPS, allowing Web MIDI in supported browsers. The public
origin needs its own first-use MIDI permission and keeps separate local settings
from localhost. Physical keyboard checks still need the actual device.

Next experiment: play a song together, then decide what feels fun enough to keep.

For product context, see the [piano-learning landscape and competitive overview](docs/piano-learning-landscape.md)
(platforms, pricing and open-source alternatives; researched October 2026).

## License and content

The [MIT license](LICENSE) covers original Kidmidi software and documentation.
Third-party dependencies retain their own licenses. Compositions, lyrics,
arrangements, recordings, artwork and source photographs are separate from the
code license unless explicitly identified otherwise. In particular, the
Räge-Rägetröpfli song data, downloadable score and songbook photo are not offered
under MIT; see their [provenance](docs/transcriptions/raege-raegetroepfli.md).
