# Learners and curriculum

The first learning activity is Note Hunt. Recognition, positive heart rewards,
curriculum decisions, persistence and presentation have separate owners. Song
practice remains patient and pitch-only; its input does not affect game rewards.

## Local foundation

`learning.ts` contains the deterministic curriculum policy and response timer.
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

Lifetime earned hearts determine level: level N starts at 12 × (N − 1)² hearts.
Spending affects the wallet, never lifetime level or mastery. The initial fox is
free; pets and charms are fixed-price, permanent cosmetics. No random purchases,
expiring rewards, streak loss, or paid currency.

## MVP curriculum policy

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
null. Speed never changes rewards or unlock eligibility.

Tests simulate multi-day journeys, midnight/DST, interrupted timing, difficult
notes, idempotent awards, profile isolation and concurrent spending without real
waits. Deterministic simulations establish policy behaviour, not learning efficacy.

## Eventual hosted accounts

Keep local learner IDs independent of login identity. A future adult account can
own multiple learners; children need no email address. Sign-in should link/import
existing local learners explicitly and retain offline play. Account/session
credentials must never enter learner exports or public repository data.

An eventual remote repository/sync adapter will need an outbox, server-side
idempotency for encounter and purchase IDs, authorization per account/learner,
schema migrations, deletion/export, and explicit conflict resolution for profile
edits and simultaneous offline spending. The server must validate awards and
prices; local transactional protection is not server authority. Prefer merging
immutable encounters/purchases and rebuilding projections over last-write-wins
heart totals. Device calibration stays local. Profile history includes learning
data and should upload only through an explicit account/link flow.

Later curriculum work can distinguish assisted/unassisted recall, clefs and
octaves, and introduce accidentals with their written spellings. F♯ and G♭ share a
piano key but are separate notation concepts. Additional activities can consume
the same learner identity and reward ledger while maintaining their own skill
evidence and policies.
