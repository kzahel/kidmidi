# Kidmidi

A small piano playground for children and parents. Follow a familiar melody at
your own pace: the staff waits until you press the next note. An early experiment,
with Twinkle, Twinkle, Hot Cross Buns, Räge-Rägetröpfli, and free play.

**Play:** https://kzahel.github.io/kidmidi/

The interface starts with compact song/MIDI controls, then the staff and piano.
Keep titles, promotional copy, and decorative sections out of the practice view.
Use **Kid** (default, large notation) or **Compact** (smaller notation), and toggle
**Multiline** for pages containing multiple printed line groups when space allows.
Layout choices are remembered in this browser and work independently for every
song. The staff, illustration and piano fit within the screen without scrolling.
Kid and Compact set the maximum notation size; engraving adapts to the available
width and height. Pages advance with played-note feedback, and small arrows allow
browsing multiline pages. Short or narrow screens show fewer line groups per page.
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

If several inputs are available, choose the piano from the selector. Its ID,
name and manufacturer are remembered locally. Replugging restores that input;
a temporary fallback does not overwrite the preference. If an ID changes, a
unique matching name/manufacturer can restore the choice. Plugging and unplugging
updates the device list without another permission request. Refreshing an unchanged
port list does not clear held notes. The physical keyboard produces its own sound;
MIDI carries notes, not audio. There is no microphone capture.

You can also tap/click the on-screen piano or use A S D F G H J K for C4 through C5.
On-screen keys and **Hear this phrase** use a simple synthesized preview voice.
The piano has proportioned keys and stays centered instead of stretching across
a wide screen. Kid mode keeps slightly wider touch targets. On small screens the
entire piano scales to fit the width and available height. Notes outside its visible
C3–C5 range still arrive from MIDI and appear in the last-played readout.

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
- `src/explore.ts`: raw MIDI capture, loose note/chord grouping and live MusicXML.
- `src/view.ts`: Compact/Kid sizing and saved multiline settings.
- `src/rain.ts`: manually checked songbook transcription and source illustration.
- `src/useMidi.ts`: automatic permission request/reconnect and connection lifecycle.
- `src/midi-device.ts`: saved input preference and deterministic device selection.
- `src/audio.ts`: local preview voice. It never sends notes to the physical piano.
- `src/App.tsx`: practice UI and shared input handling for MIDI, pointer and keys.

The Räge-Rägetröpfli song is manually transcribed from the supplied book photo:
all 12 bars, key/time signatures, chord symbols, lyrics, stems, flags and final
barline. Its original illustration appears beside the score. Use **Multiline**
to browse all four printed line groups, **Book photo** for the source, or
**MusicXML** to export. Chords are visual references; practice still matches melody notes only.
See [transcription evidence](docs/transcriptions/raege-raegetroepfli.md).

In song practice, the score is the target. In **Just explore**, playing writes a
running score in loose 4/4: notes appear immediately, nearby attacks form chords,
and long pauses are skipped. Low notes add a bass staff. The newest note/chord
stays highlighted. Compact/Kid and Multiline also work here; the view shows the
latest two bars (four with Multiline), while **MusicXML** downloads the full take.
Use **Clear recording** (↺) to start again. Captures stay in memory when switching
songs, and reset on reload. A take holds up to 512 attacks and then asks you to
download or clear it. See [live notation behavior](docs/explore-transcription.md).

Rhythm is approximate, with no inferred tempo, meter or hand independence.
There is no audio transcription or automatic MIDI-file/photo import.
Session progress and recordings are in memory; refreshing starts over.
There are no analytics, uploads, or external page assets. The first local install
requires the network.

## Validate

```sh
npm run typecheck
npm test
npm run check
npm run build
npx playwright install chromium # first time only
npm run test:browser
```

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

The full browser suite and built project-path smoke check remain available locally
and through the separate **Browser checks** manual Actions workflow
(`.github/workflows/browser-checks.yml`). Run that after renderer/input changes or
when investigating browser behavior. It does not gate the fast Pages deployment.
Pages uses the **GitHub Actions** publishing source and the `github-pages`
environment. No deploy credentials or external hosting are required.

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
