# Learners and curriculum

The first learning activity is Note Hunt. Recognition, positive heart rewards,
curriculum decisions, persistence and presentation have separate owners. Song
practice remains patient and pitch-only; its input does not affect game rewards.

The [long-term product direction](product-direction.md) calls for different
forms of play and motivation for toddler co-play and older children, reviewed
through family use and experienced teacher advice. The current Note Hunt
curriculum is one activity, not a required starting point for every age.
Age-specific presets and curriculum revisions remain future work.

## Local foundation

`lesson-catalog.ts` contains lesson/world content; `curriculum.ts` contains pure
deck, assessment and legacy purchase policy. `learning.ts` retains the relaxed adaptive
practice policy and response timer.
`learners.ts` contains learner/reward models and pure transitions.
`LearnerRepository` is the asynchronous persistence boundary; the IndexedDB
adapter uses versioned stores for learners, encounters, purchases and selection.
Stable encounter IDs make retrying a completed round idempotent. Rewards and
curriculum updates commit with the encounter in one transaction. Purchases check
the current balance in that same transaction, including across browser tabs.

Each learner has a name, fixed IANA learning timezone, unlocked notes and equipped
pet/charm. Device MIDI identity, keyboard calibration and connection preferences
belong to the browser/device, not the learner. Explore recordings currently remain
a shared local library, separate from learner assessments.

Badges record completed skills; they do not restrict lesson access. All implemented
lessons are immediately selectable, regardless of earned currency or earlier
badges. The displayed progress is a badge count, with separate heart and gem
wallets. Previous world purchases remain in the ledger and are not charged again;
the old purchase policy is retained only for compatibility, with no gate-purchase
control in the lesson browser. Existing hearts, badges, pets and charms stay intact.
The initial fox is free; pets and charms are fixed-price, permanent cosmetics,
equipped immediately when bought. No random purchases, expiring rewards, streak
loss, or paid currency.

## Rewards and collection

The Learners & rewards dialog is fitted to the viewport. Rewards, Learners, and
Progress tabs separate the collection from profile forms and learning evidence.
The shop has Friends/Dress up categories, two preview cards per page, and explicit
Back/More buttons. The stage shows the selected friend wearing the selected
accessory. Previews never call purchase/equip or alter saved state. The action
button buys once or equips an owned item; the equipped item is labelled With you.
Unavailable prices show the remaining hearts/gems. Take off removes equipment,
not ownership. Profile switching resets the shop to that learner's equipment.

Fox, cat, bunny and puppy share original vector artwork across the stage,
collection, home menu and header. The selected learner's equipped companion also
accompanies song selection and the lesson browser, and sits beside the piano
in songs, Note Hunt, Pattern Hunt and Free play. Desktop layouts reserve a side
column; phones reserve space above the keys beside compact keyboard controls.
The complete score and piano remain visible without overlap or scrolling.
The companion sways for live playing/recording playback, and cheers for song hits
or completed Note Hunt cards/patterns. It stays through lesson results, follows
profile/equipment changes immediately and restores the saved outfit on reload.
Companion presentation cannot advance practice, capture notes or award currency.
Reduced motion keeps the companion/reaction symbols and suppresses movement.
Accessories are drawn in the same coordinate
space, so previews match the worn outfit. Blinking and the short equipment
entrance respect reduced motion. The original vector art is MIT-licensed.

| Accessory             | Hearts |
| --------------------- | ------ |
| Party bow             | 12     |
| Star charm (necklace) | 24     |
| Cosy scarf            | 18     |
| Daisy crown           | 24     |
| Golden crown          | 48     |

Existing stable IDs, prices, purchases and equipment remain valid. Cat costs
18 hearts, bunny 30 hearts, puppy 3 gems. There are no changes to earning rules.
The Progress tab pages through recent single-note evidence or lesson badges.

## Lessons and progress

Note Hunt opens **Lessons**. Labelled group buttons switch Find notes (Garden),
Read notes (Treehouse), Patterns (River), and Coming soon. Cards show the concrete
skill/range, assistance, set length, and Ready to play or Badge earned. No playable
card is disabled by curriculum order. The catalog order suggests a progression,
while learners can skip ahead or experiment freely. Pets do not select levels.
The prominent ← Lessons button in the main header returns to the active
lesson's group; Home remains available alongside it.

The browser displays at most four cards per page, with Back/More buttons as
needed. It fills the available viewport without scrolling, on tablets in either
orientation and on phones. Coming soon previews have their own pages: bass clef,
mixed clefs/octaves, accidentals, key signatures and simultaneous notes. These
are unimplemented directions, clearly separate from playable choices.

| Group                     | Lessons                                      | Name support  | Hearts on attempts 1/2/3 | New badge gems |
| ------------------------- | -------------------------------------------- | ------------- | ------------------------ | -------------- |
| Find notes                | C/E/G; C–G; C–C                              | Always        | 3/2/1                    | 1 each         |
| Read notes                | C/E/G; C–G; C–C                              | 💡 on request | 6/4/2                    | 2 each         |
| Read notes optional Quick | C–C                                          | 💡 on request | 9/6/3                    | 2              |
| Patterns                  | Step up; Step down; Skip a key; Out and back | Always        | 3/2/1 per note           | 1 each         |

Each single-note lesson generates a balanced, shuffled set with two visits per
pitch (6, 10 or 16 cards). Pattern lessons shuffle two intact three- or five-note
shapes twice (four patterns per set); badge assessment also verifies complete
pattern sequences, rather than just pitch totals. Normal mixed single-note cards
never immediately repeat. A badge requires:

- A complete set from one run and one lesson revision; sets cannot be combined.
- At least 80% first-attempt finds and at least one qualifying find for every pitch.
- For reading lessons, those qualifying finds must have used no note-name help.
- For optional Quick only, qualifying first responses must be at most 4,000ms.
  Null/interrupted timings do not qualify. Ordinary lessons ignore timing.

Help remains available on every reading card, and matched cards reveal their
names after assessment. A miss, help or long pause never ends a card or removes
earned currency. Heart rewards depend on attempts and the selected lesson, not
response speed. There is no countdown, timeout, buzzer, negative result screen or
streak loss. The ending shows hearts, qualifying finds and a badge/new gems when
earned, with replay and map buttons. These initial thresholds need playtesting;
they are not validated learning-efficacy measures.

A new badge grants gems once per stable lesson ID. Replays award hearts but cannot
farm gems. Three gems buy a permanent puppy friend. Heart and gem spending are
separate ledgers. Badges (including their original gem award) commit with the final
encounter in the same IndexedDB transaction; retries and competing tabs cannot
double-award a badge or overspend either wallet. A storage failure keeps pending
encounters in the tab for retry; purchases wait until they save.

Opening settings/profiles suspends a lesson card/pattern position, preserving its
guesses and help state and invalidating its response timing. Switching learners cancels the old
lesson and callbacks. Returning to the map/restarting begins a new run; refresh
also resets the unfinished run. Already completed finds/hearts always persist,
but partial sets do not earn badges. Practice rounds retain their earlier reset
behavior. Transport, held-key celebration and song practice remain independent.

### Editing and adding content

Edit **`src/lesson-catalog.ts`**, rather than UI or persistence code:

- World definitions provide stable `id`, short `name`, `icon`, parent-facing
  `topic`, and legacy entry/gate metadata for older world purchases. Those
  fields no longer restrict lesson access. The browser groups playable worlds
  by explicit skill labels; unsupported worlds appear only under Coming soon.
- Lesson definitions provide stable `id`, positive `revision`, world ID, short
  name/icon, pitches, support policy, suggested predecessor, heart multiplier, gem award
  and assessment parameters (repetitions, accuracy, successes per pitch, optional
  fluent-response threshold).
- `description` supplies the visible range/support or pattern example. Optional
  `patterns` supplies equal-length pitch arrays: the session recognises each
  pitch and celebrates at pattern boundaries; `notes` is their unique pitch union.
  Current patterns always show names and use the ordinary attempt rewards.
- Reorder definitions freely. Bump `revision` when changing assessment meaning;
  earlier-run evidence cannot satisfy a revised assessment. Previously awarded
  badges, gems and purchases remain permanent. Use a **new ID** for a separate
  skill that should award its own badge/gems. IDs must not be recycled.
- A new single-note treble lesson can use the existing renderer/session. New
  clefs, signatures or chords also need an appropriate renderer and
  recognition policy before adding playable content. Do not expose those worlds
  as purchasable previews.

Old version-1 IndexedDB records need no destructive migration: absent `badges`
means none, absent purchase `currency` means hearts, and encounters without lesson
metadata remain practice evidence. Completed lesson encounters include stable
lesson/revision/run IDs, card index and explicit assistance. Badge awards live on
the learner projection; existing records and all device/recording stores remain
untouched. Later remote sync must reconcile badge awards as well as encounters.

Focused tests cover free advanced-lesson access, intact pattern decks, balanced
decks, accuracy/coverage, help, timing, revising assessments, permanent badges, replay farming, legacy records, two wallets,
idempotency and concurrent transactions. Browser journeys cover actual rendering,
the Garden badge journey, direct advanced choices, assisted/unassisted reading,
Quick, profile isolation, settings interruptions, pet purchases, reloads and small-screen fit.

## Relaxed Practice learning path

Start with C4/E4/G4, then introduce D4, F4, A4, B4 and C5 individually. Pattern
encounters do not enter the single-note adaptive evidence or daily review.
Expansion requires at least six encounters per available note in its latest twelve, at
least 80% first-attempt success, and first-attempt successes on three distinct
days. An unlock is permanent. These are explicit starting parameters to tune
through actual parent/child play, not validated pedagogical thresholds.

The first adaptive cards of each learning day review up to three previously seen
notes, prioritizing uncertain/older ones. That list is based on earlier days and
completed reviews persist, so reopening does not restart the review. Missing days
causes review, not a penalty. New ideas alternate with familiar material; weighted
practice favours uncertain notes without excluding familiar successes. There are
no immediate repeats in normal mixed practice.

Evidence includes exact pitch and spelling, guesses, assistance, source, date,
first-response latency and completion latency. Note-name assistance is explicit:
this MVP measures supported note finding, not independent sight-reading mastery.
Calendar and monotonic clocks are separate and injectable. Timing starts after
notation rendering; interrupted rounds retain accuracy evidence but latency is
null. Speed never changes rewards or unlock eligibility. Only completed finds
enter the MVP history; abandoning a partially attempted card does not yet save
that encounter. The parent view therefore labels this evidence as recent finds.

Tests simulate multi-day journeys, midnight/DST, interrupted timing, difficult
notes, idempotent awards, profile isolation and concurrent spending without real
waits. Deterministic simulations establish policy behaviour, not learning efficacy.

## Eventual hosted accounts

Accounts remain optional. Ordinary local play must stay available without login;
future sync should preserve a usable local copy and a way to export learner
history. Complete learner export/import is not implemented yet. Optional paid
support or hosted services must remain separate from earned hearts/gems and
curriculum gates; no payment model is decided.

Keep local learner IDs independent of login identity. A future adult account can
own multiple learners; children need no email address. Sign-in should link/import
existing local learners explicitly and retain offline play. Account/session
credentials must never enter learner exports or public repository data.

An eventual remote repository/sync adapter will need an outbox, server-side
idempotency for encounter and purchase IDs, authorization per account/learner,
schema migrations, deletion/export, and explicit conflict resolution for profile
edits and simultaneous offline spending. The server must validate awards and
prices, including badges and one-time gems; local transactional protection is
not server authority. Prefer merging
immutable encounters/purchases and rebuilding projections over last-write-wins
heart totals. Device calibration stays local. Profile history includes learning
data and should upload only through an explicit account/link flow.

Later curriculum work can extend assisted/unassisted assessment to other clefs
and octaves, and introduce accidentals with their written spellings. F♯ and G♭ share a
piano key but are separate notation concepts. Additional activities can consume
the same learner identity and reward ledger while maintaining their own skill
evidence and policies.
