# Global sound and the sound playground

The header’s Sound and settings button is available on Home and every activity,
even when Web MIDI is unsupported or permission is denied. It shows the chosen
route and Screen sound emoji. Its fitted dialog uses Sounds, Make, Output and
Keyboard tabs instead of a scrolling settings sheet. Escape closes it and returns
focus to the opener. Tab lists support Left/Right arrows, Home and End, with one
selected tab in the keyboard tab order. Switching the main tab releases held
audition notes while keeping the current voice and unfinished save-form name.

Sounds has Presets and My sounds shelves. Saved sounds use four-item pages, so
all twelve remain reachable without growing the panel. Deleting a final-page
sound clamps the page to the remaining collection. Make separates Tone, Motion,
Envelope and Save into smaller tabs. The live waveform and audition keys remain
visible on Sounds and Make; wide/landscape views place them beside the controls.
Screen routing and volume live under Output; MIDI setup lives under Keyboard.
The dialog, its panels and their controls fit desktop, portrait phones down to
320×568, and 844×390 landscape without scrolling, clipping or overlapping controls.

## Destinations

| Route    | Physical MIDI keys         | Screen / computer keys                 | Phrase / recording playback            |
| -------- | -------------------------- | -------------------------------------- | -------------------------------------- |
| Auto     | Piano’s own sound          | Screen                                 | Selected MIDI output, otherwise Screen |
| Screen   | Screen synth               | Screen                                 | Screen                                 |
| Keyboard | Piano’s own sound          | Selected MIDI output, otherwise Screen | Selected MIDI output, otherwise Screen |
| Both     | Piano’s own sound + Screen | MIDI output + Screen                   | MIDI output + Screen                   |
| Quiet    | No app sound               | No app sound                           | No app sound                           |

A physical instrument can always sound through its local speakers. The app does
not send Local Control, program changes, volume controls or SysEx to silence or
reconfigure it. The dialog explains turning down the piano for Screen-only or
quiet playing. Presets and Screen volume do not alter its instrument or volume.
Incoming MIDI is never sent back to an output; Keyboard uses the instrument’s
local sound for those physical keys. This also avoids doubling physical attacks.

The Keyboard tab contains input/output selectors and permission
retry. Output matching and reconnect identities retain the existing rules from
[midi-phrase-playback.md](midi-phrase-playback.md). Screen keys and playback fall
back to Screen if no output is available. Open/send failure reports a Screen
fallback, and later live/recording notes use Screen until settings reconfigure the
route. A release, route/output change, blur, hidden page or navigation cancels
pending opens and releases the notes the app owns. Overlapping live/recorded voices
at the same MIDI pitch share a sounding output note until their final release.

Ordinary MIDI outputs use channel 1. Live and recording notes send note-offs on
release/at recorded duration; phrase previews retain timestamped queue scheduling
and cancellation. Incoming channel-1 notes matching an outgoing attack/release
within 80ms are treated as one expected MIDI echo. Each expected echo is consumed
once; other pitches/channels remain input. MIDI note-ons are paused during a
keyboard phrase demonstration as before. This is a bounded loopback guard, not a
claim to distinguish every possible hardware MIDI routing configuration.

## Playing with sound

Seven built-in synthesized voices are Soft keys, Bubble, Robot, Ghost, Space,
Bell and Arcade. The browser generates their oscillators and a small local reverb
impulse; there are no sample downloads, microphones, uploads or external assets.
Wave shape is sine, triangle, square or sawtooth. Brightness controls a low-pass
filter; pluck/hold controls the body level; wobble modulates pitch gently. Reverb
adds a room tail. Envelope exposes attack and release; Motion includes a brief
pitch swoop that settles onto the played note. Pitch recognition always uses the
original input pitch, independent of these audible effects.

The canvas shows a schematic repeating wave while idle and actual Screen audio
while sounding. Reduced motion retains the static wave. The separate envelope
picture describes rise, body and release. Changing brightness, wave, wobble,
reverb or volume affects sounding voices; new attacks use the updated envelope
and swoop. Randomize and Reset sound affect the voice, not routing or volume.

The dialog’s small piano supports pointer holds, cancellation and Space/Enter;
connected physical keys also audition the selected route. Settings auditions
never advance a song, earn hearts, consume an attempt or enter an Explore take.
Opening/closing settings releases held notes and stops playback. Sound preferences
apply across activities without changing the patient practice or idle-hint loop.

Up to twelve named emoji sounds can be saved and individually deleted. Current
voice, route, Screen volume and saved sounds live in `kidmidi.sound.v1` localStorage,
independent of learners and recordings. Corrupt data falls back to bounded defaults;
unavailable storage leaves the playground usable for the current visit. The former
phrase-only Speakers preference migrates to Screen only if global settings do not
exist. Saved recordings keep raw notes/timing and use the current sound when played.

## Validation

Fake-clock Node tests cover all input/destination combinations, velocity, shared
MIDI pitches, duration release, cancelled opens, failures, echo expiry and saved
settings migration/validation. Browser tests cover unsupported MIDI, pointer and
keyboard audition, waveform selection, custom sound persistence/deletion, practice
isolation, actual live and recording routing with synchronous MIDI loopback, and
phone/desktop fit. A full twelve-sound shelf and every editor/output/keyboard
panel are checked for both horizontal and vertical overflow, clipped controls and
overlap at desktop, phone, 320×568 and landscape sizes. Tab keyboard navigation,
draft preservation, held-key release and focus restoration are covered too.
Offline browser audio rendering checks audible, distinct presets,
true zero volume and long phrase completeness. Desktop and phone layouts are
visually inspected using bundled Playwright Chromium. Mock outputs and offline
audio do not establish physical keyboard output compatibility; that needs an
actual instrument check.
