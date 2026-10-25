# Kidmidi

A small piano playground for children and parents. Follow a familiar melody at
your own pace: the staff waits until you press the next note. An early experiment,
with Twinkle, Twinkle, Hot Cross Buns, Räge-Rägetröpfli, free play, and Note hunt.

**Play:** https://kzahel.github.io/kidmidi/

The home menu has large activity cards for **Play a song**, **Free play**, and
**Note hunt**. Songs have their own selection screen. **Home** returns to the menu;
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

**Note hunt** shows a target note beside the note you play. **My learning path**
starts with C4/E4/G4, opens each later learning day with a short review, and adds
white notes one at a time after consistent first-try success across multiple days.
You can also choose C/E/G, C–G or C–C manually. There is no deadline or speed score.
A first-, second-, or third-try find earns three, two or one heart points; every
find celebrates. Higher/lower cues help after a guess. Matched cards linger while
keys are held and for 1.6 seconds after release. MIDI, touch and computer keys work.
See [Note hunt behavior](docs/note-hunt.md).

**Learners & rewards** lets families add, rename and switch learners. Each learner
keeps their own history, lifetime hearts, level and spendable heart balance. A free
fox keeps them company; hearts buy permanent pet friends and charms. Spending never
reduces level or learning progress. Profiles and completed rounds persist locally
in IndexedDB; device settings and the Explore recording library stay separate.
A failed progress save offers retry and retains the pending award in that tab.
There are no accounts, sign-in or cross-device sync yet. See
[learning policy and hosted-account direction](docs/learners-and-curriculum.md).

Rhythm is approximate, with no inferred tempo, meter or hand independence.
There is no audio transcription or automatic MIDI-file/photo import.
Song position and current game rounds reset on refresh; learner progress, hearts,
rewards and Explore recordings persist locally.
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
