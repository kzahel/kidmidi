# Phrase playback through the keyboard

Hear this phrase prefers the connected keyboard's MIDI output. Web MIDI access
already includes ordinary note output; no SysEx permission or extra connection
button is required. [MIDIOutput.send](https://www.w3.org/TR/webmidi/#midioutput-interface)
schedules note messages against the page's performance clock.

## Choosing the output

`useMidi` enumerates connected outputs alongside inputs. Auto matches the selected
input's normalized name (ignoring Input/Output/In/Out labels), with manufacturer
agreement where available. A unique output from the same manufacturer is the
fallback. Known virtual routing outputs are excluded from automatic matching;
multiple matches or unrelated outputs fall back to speakers rather than guessing.

The Phrase sound selector offers Auto, Speakers and explicit output ports when
outputs exist. `kidmidi.midi-output.v1` remembers an explicit identity or Speakers.
Exact output ID wins; a unique name/manufacturer match handles changed IDs. If a
saved output is unavailable, the menu labels that state and Auto/speakers supplies
the current fallback. Choosing an output manually can deliberately use a virtual
port. Opening an output may refresh the port list; an unchanged output object does
not cancel its own demonstration.

## Playing and stopping

`PhrasePreview` owns demonstrations separately from recognition, physical input,
Explore recordings, and the local live piano voice. It explicitly opens the MIDI
output before scheduling. Notes use channel 1 (0x90/0x80), velocity 90, a 480ms
quarter, 80ms lead-in and 40ms separation before the next note. No program change,
volume, pedal or broad all-notes-off/controller reset is sent; the keyboard's own
current sound and receive/volume settings apply.

While playing, Hear this phrase becomes Stop preview. Stop, restart, song/input/
output changes, blur, hiding the page and disconnecting cancel queued messages and
send immediate note-offs for the pitches this preview used. Cleanup is best effort
if the port is already disconnected. A cancelled asynchronous open cannot start
notes later. Only outputs supporting queue cancellation are used; failed opening
or scheduling falls back to speakers and reports that fallback briefly.

MIDI note-ons are paused while a keyboard demonstration is active, including while
its output is opening, so looped-back demo notes do not count toward a song or
recording. Releases still clean up any held physical keys. Stop resumes normal note input. No outgoing messages are routed through the
practice input handler. The on-screen piano and saved Explore recording player
continue to use their existing local voices; Phrase sound applies to song previews.

## Validation

Fast Node tests use fake clocks, outputs and speaker voices to check timestamps,
repeated-note articulation, note-offs/cancellation, stale asynchronous opens,
speaker fallback and output matching/ambiguity. One browser integration checks
input/output pairing with a Through port listed first, output-open state changes,
MIDI-only routing without speaker oscillators, echo isolation, Stop cleanup,
persisted speaker selection, disconnection fallback and phone fit. Desktop/phone
controls are visually reviewed with bundled Playwright Chromium.

These checks establish message routing and lifecycle behavior. Hearing the actual
Casio's internal sound still requires a manual test on the attached instrument.
