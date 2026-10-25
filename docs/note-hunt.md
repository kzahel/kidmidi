# Note hunt

Patient note-finding cards and short pattern lessons for the piano. Two cards show a target
and the latest guess on the same treble-clef notation used in practice. Written
note lengths are just notation; the game matches exact MIDI pitch, including the
octave, without testing rhythm. Garden and relaxed Practice show note names;
Treehouse hides names until 💡 or a match. See the [lesson catalog and assessment policy](learners-and-curriculum.md).

## Rounds and rewards

- Note Hunt opens **Lessons**, with labelled Find notes (Garden), Read notes
  (Treehouse), Patterns (River) and Coming soon groups. Every implemented lesson
  can be selected immediately: badges and hearts never block experimentation.
  Cards show range/support, length and Ready to play/Badge earned. Groups contain
  at most four visible cards per page, with explicit Back/More controls when
  needed. The complete browser fits the viewport without scrollbars, including
  tablet portrait/landscape and phones. Returning from a lesson selects its group.
  Future topics are noninteractive Coming soon previews, not locked lessons.
  Existing badges and earlier gate purchases stay saved. New badges grant gems
  once; replays still earn hearts. The puppy costs three gems.
- **🎹 Free practice** opens the original relaxed game. Its default is **My learning
  path**: C4/E4/G4 anchors, daily review, then gradual
  expansion through D4/F4/A4/B4/C5. Review completion and unlocked notes persist
  per learner. Recent first-attempt accuracy across at least three learning days
  drives expansion; response speed never affects rewards or advancement. See
  [curriculum policy](learners-and-curriculum.md) for thresholds and test scenarios.
- Manual C/E/G, C–G and C–C ranges remain available. Each chosen-range game starts
  on middle C with the C4, E4, C4, G4 introduction, then random nonrepeating targets.
  Switching learners returns to the adaptive path. No target currently uses a sharp
  or flat; black-key guesses still appear accurately on the staff.
- Only fresh attacks count. Transport deduplicates held note-ons by source,
  channel and pitch; releases never count as guesses. Repeated fresh attacks on
  the same wrong note do count. Chords count each attack as a guess.
- Finding a note on attempt one/two/three earns three/two/one hearts in Practice,
  Garden and Patterns, six/four/two in Treehouse, and nine/six/three in optional Quick, added
  to the running point total. Speed never reduces those rewards. Later finds earn
  zero; existing points never decrease.
  Pale hearts show which bonus hearts are no longer available on this card.
- Every find turns both cards green and celebrates with confetti. A higher/lower
  cue follows a wrong guess, with no error buzzer, deadline, or failed round.
- In single-note lessons and Practice, matched notation and rewards remain visible while any keys are down, then for
  1.6 seconds after all keys are released. Further playing during celebration
  still sounds but cannot alter the matched cards or earn another reward.
- Switching modes, restarting, opening profile/device dialogs or changing range
  releases held keys and cancels pending celebration work. Lessons preserve the
  current card's guesses/help across dialogs; their interrupted timing becomes
  null. Mode/range changes and restarts begin a fresh set. Current-game points restart
  in Practice; lesson totals resume across dialogs;
  completed encounters and earned hearts remain with their original learner.
  Switching learners cannot transfer an old card, delayed callback or award.
- Completed finds save with stable IDs; retry cannot award the same round twice.
  An explicit save error retains pending encounters in the current tab for retry.
  Saved history drives permanent badges and spendable rewards. Song
  practice does not award game hearts. Explore recordings remain separate/shared.
- Learning evidence explicitly records whether note-name help was used, exact
  octave/spelling, guesses, input source and response timing.
  Timing starts once the target staff renders. Interrupted timings are excluded;
  a long pause never costs hearts. New sessions do not require a timer or server.

## Pattern hunt

Patterns are available alongside early note finding, without prerequisites. Step
up and Step down each use two three-note white-key sequences beginning on C/D or
E/F; Skip a key uses C–E–G and G–E–C; Out and back uses C–D–E–D–C and D–E–F–E–D.
Each set shuffles two visits to each intact pattern. The staff stays fixed within
a pattern, showing all notes from the start. Completed positions get green checks
and the latest correct staff note highlights. Wrong pitches leave the current
position waiting with higher/lower feedback; accepted earlier notes remain.
Names are shown, rhythm is not assessed and there is no required speed.

Fresh correct attacks advance inside the visible pattern immediately. Only the
pattern's final note starts the existing held-key/1.6-second celebration. Further
playing in that celebration cannot score or advance. Each accepted pitch saves
one attempt-based encounter, including its lesson/run/index, with 3/2/1 hearts.
The lesson badge requires all complete catalog patterns, 80% first-try notes and
at least one first-try find for every pitch. This is supported pattern following,
not evidence of independent single-note reading. Pattern encounters are excluded
from adaptive single-note review/expansion. Settings preserve the current position
and guesses; switching learners discards unfinished runs. Completed finds and
awards persist, including through reload; partial runs do not earn badges.

## Rendering and validation

`src/hunt.ts` owns pure round/score transitions; `src/lesson-catalog.ts` defines
versioned content and `src/curriculum.ts` owns lesson assessments and decks.
`src/learning.ts` owns relaxed adaptive policy and injectable clocks.
`src/useHuntSession.ts` coordinates presentation and learner-bound encounters. `src/NoteHunt.tsx` owns cards and the scoped celebration
stylesheet. The shared Score renderer's flashcard option
hides time signatures and permits a narrower engraving with larger glyphs.
The two cards and full piano fit the viewport without scrolling. Reduced motion
keeps the green cards and hearts while suppressing confetti and heart animation.
No network services are used. Profiles persist through the asynchronous learner
repository.

Node tests cover intact pattern decks/assessment, direct advanced-lesson access, reward boundaries, exact-octave matching, single reward per
round, introduction, range selection and score continuity. One browser boundary
test covers actual mocked MIDI routing, held-message deduplication, both staff
cards, release/celebration timing, wrong-octave feedback, phone fit, reset and
switching back to practice. The existing suite covers pointer/computer input and
practice/explore regressions. Desktop, phone and landscape cards were visually
checked with bundled Playwright Chromium; physical MIDI remains a manual check.

Browser checks also exercise full pattern sets, phrase-boundary celebrations, direct advanced choices, paged previews, profile switching, permanent rewards,
cosmetic equipment, reloads, next-day review resumption, storage failures/retries,
interrupted clocks and touch-target geometry. Node journeys advance through twenty
simulated days with seeded randomness rather than real-time waits.
