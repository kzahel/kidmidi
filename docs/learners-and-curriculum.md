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
deck, assessment and gate policy. `learning.ts` retains the relaxed adaptive
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

The displayed world is the highest permanently opened world, replacing the former
lifetime-heart level. Lifetime hearts remain intact and visible in the parent
view; old hearts do not establish new skill badges. Spending affects the appropriate
wallet, never badges or opened gates. The initial fox is free; pets and charms are fixed-price, permanent cosmetics, equipped immediately
when bought. No random purchases, expiring rewards, streak loss, or paid currency.

## Worlds and lessons

Note Hunt opens a map with eight numbered, illustrated destinations. Only Garden
and Treehouse currently have playable content. The other six show **Soon**, with
no purchasable gate: bass clef, mixed clefs/octaves, accidentals, key signatures,
phrases and simultaneous notes. These are curriculum directions, not implemented
assessments. Child screens use emoji, numbers, a few short labels and accessible
names; detailed policy belongs in the grown-up view and these docs.

| World                    | Lessons         | Name support  | Hearts on attempts 1/2/3 | New badge gems |
| ------------------------ | --------------- | ------------- | ------------------------ | -------------- |
| Garden                   | C/E/G; C–G; C–C | Always        | 3/2/1                    | 1 each         |
| Treehouse                | C/E/G; C–G; C–C | 💡 on request | 6/4/2                    | 2 each         |
| Treehouse optional Quick | C–C             | 💡 on request | 9/6/3                    | 2              |

The first lesson is free. Each subsequent lesson needs the preceding badge.
Treehouse requires Garden's C–C rainbow badge **and a one-time 60-heart purchase**.
The learner chooses when to buy it. A perfect Garden journey earns 96 hearts, so
it can fund its gate in one sitting without a multi-day requirement. Replay any
opened lesson or use the original Practice game to collect more hearts. Unlimited
easy hearts cannot bypass badge prerequisites.

Each lesson generates a balanced, shuffled set with two visits per pitch (6, 10
or 16 cards). Normal mixed cards never immediately repeat. A badge requires:

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

Opening settings/profiles suspends a lesson card, preserving its guesses and help
state and invalidating its response timing. Switching learners cancels the old
lesson and callbacks. Returning to the map/restarting begins a new run; refresh
also resets the unfinished run. Already completed finds/hearts always persist,
but partial sets do not earn badges. Practice rounds retain their earlier reset
behavior. Transport, held-key celebration and song practice remain independent.

### Editing and adding content

Edit **`src/lesson-catalog.ts`**, rather than UI or persistence code:

- World definitions provide stable `id`, short `name`, `icon`, parent-facing
  `topic`, `entry: true` for the free starting world, and an optional gate with a
  heart price and required badge ID.
- Lesson definitions provide stable `id`, positive `revision`, world ID, short
  name/icon, pitches, support policy, prerequisite, heart multiplier, gem award
  and assessment parameters (repetitions, accuracy, successes per pitch, optional
  fluent-response threshold).
- Reorder definitions freely. Bump `revision` when changing assessment meaning;
  earlier-run evidence cannot satisfy a revised assessment. Previously awarded
  badges, gems and purchases remain permanent. Use a **new ID** for a separate
  skill that should award its own badge/gems. IDs must not be recycled.
- A new single-note treble lesson can use the existing renderer/session. New
  clefs, signatures, phrases or chords also need an appropriate renderer and
  recognition policy before adding playable content. Do not expose those worlds
  as purchasable previews.

Old version-1 IndexedDB records need no destructive migration: absent `badges`
means none, absent purchase `currency` means hearts, and encounters without lesson
metadata remain practice evidence. Completed lesson encounters include stable
lesson/revision/run IDs, card index and explicit assistance. Badge awards live on
the learner projection; existing records and all device/recording stores remain
untouched. Later remote sync must reconcile badge awards as well as encounters.

Focused tests cover balanced decks, accuracy/coverage, help, timing, revising
assessments, permanent badges, replay farming, legacy records, two wallets,
idempotency and concurrent transactions. Browser journeys cover actual rendering,
the complete Garden gate journey, assisted/unassisted reading, Quick, profile
isolation, settings interruptions, pet purchases, reloads and small-screen fit.

## Relaxed Practice learning path

Start with C4/E4/G4, then introduce D4, F4, A4, B4 and C5 individually. Expansion
requires at least six encounters per available note in its latest twelve, at
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
