# Note hunt

A patient flashcard game for finding a note on the piano. Two cards show a target
and the latest guess on the same treble-clef notation used in practice. Written
note lengths are just notation; the game matches exact MIDI pitch, including the
octave, without testing rhythm. Note names and a middle-C label support beginners.

## Rounds and rewards

- Every game starts on middle C. The introduction is C4, E4, C4, G4; later cards
  choose randomly from the selected range without immediately repeating a target.
- The default range is C4/E4/G4. C4–G4 and C4–C5 add more white notes. No target
  uses a sharp or flat. A black-key guess still appears accurately on the staff.
- Only fresh attacks count. Transport deduplicates held note-ons by source,
  channel and pitch; releases never count as guesses. Repeated fresh attacks on
  the same wrong note do count. Chords count each attack as a guess.
- Finding a note on attempt one/two/three earns three/two/one hearts, added to the
  running point total. Later finds earn zero; existing points never decrease.
  Pale hearts show which bonus hearts are no longer available on this card.
- Every find turns both cards green and celebrates with confetti. A higher/lower
  cue follows a wrong guess, with no error buzzer, deadline, or failed round.
- Matched notation and rewards remain visible while any keys are down, then for
  1.6 seconds after all keys are released. Further playing during celebration
  still sounds but cannot alter the matched cards or earn another reward.
- Switching modes, restarting or changing range releases held keys and cancels
  the pending round timer. Range changes restart the points and introduction.
  Game state is in memory only; recordings from Just explore remain separate.

## Rendering and validation

`src/hunt.ts` owns pure round/score transitions. `src/NoteHunt.tsx` owns the cards
and lightweight CSS celebration. The shared Score renderer's flashcard option
hides time signatures and permits a narrower engraving with larger glyphs.
The two cards and full piano fit the viewport without scrolling. Reduced motion
keeps the green cards and hearts while suppressing confetti and heart animation.
No new dependencies or network services are used.

Node tests cover reward boundaries, exact-octave matching, single reward per
round, introduction, range selection and score continuity. One browser boundary
test covers actual mocked MIDI routing, held-message deduplication, both staff
cards, release/celebration timing, wrong-octave feedback, phone fit, reset and
switching back to practice. The existing suite covers pointer/computer input and
practice/explore regressions. Desktop, phone and landscape cards were visually
checked with bundled Playwright Chromium; physical MIDI remains a manual check.
