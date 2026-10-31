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
pet and outfit. Device MIDI identity, keyboard calibration and connection preferences
belong to the browser/device, not the learner. Explore recordings currently remain
a shared local library, separate from learner assessments.

Badges record completed skills; they do not restrict lesson access. All implemented
lessons are immediately selectable, regardless of earned currency or earlier
badges. The displayed progress is a personal-best star count, with separate heart and gem
wallets. Previous world purchases remain in the ledger and are not charged again;
the old purchase policy is retained only for compatibility, with no gate-purchase
control in the lesson browser. Existing hearts, badges, pets and charms stay intact.
The initial fox is free; pets and charms are fixed-price, permanent cosmetics,
equipped immediately when bought. No random purchases, expiring rewards, streak
loss, or paid currency.

## Rewards and collection

The Learners & rewards dialog is fitted to the viewport. Rewards, Learners, and
Progress tabs separate the collection from profile forms and learning evidence.
Friends and Dress up use thumbnail galleries with prices and Yours/Wearing marks.
Only the gallery scrolls; the outfit preview, category/filter controls and explicit
buy/choose/take-off action stay in view. The gallery is keyboard-focusable, and
cards can be reached with Tab as well as touch/pointer scrolling. Dress up filters
are All accessories, Halloween, Hats & hair, Glasses & ears, Clothes & wings, Charms & bags,
Yours and Wearing. Friends can be filtered to All friends, Yours or Wearing.

Selecting a card previews that piece alongside the saved outfit. Previews never
call purchase/equip or alter saved state. Buying equips once; choosing an owned
piece is free. A worn accessory's action removes only that piece, while Take all
off clears the outfit without changing ownership. After removal the stage shows
the saved outfit until another preview is selected. Unavailable prices show the
remaining hearts/gems. Profile switching resets the shop to that learner's friend
and outfit.

Fox, cat, bunny, puppy, bird, frog, panda and little dragon share original vector
artwork across the stage, collection, home menu and header. The selected learner's equipped companion also
accompanies song selection and the lesson browser, and sits beside the piano
in songs, Note Hunt, Pattern Hunt and Free play. Desktop layouts reserve a side
column; phones reserve space above the keys beside compact keyboard controls.
The complete score and piano remain visible without overlap or scrolling.
The companion sways for live playing/recording playback, and cheers for song hits
or completed Note Hunt cards/patterns. It stays through lesson results, follows
profile/equipment changes immediately and restores the saved outfit on reload.
Free play also has live musical dance discoveries: scales, echoes, alternating
notes, arpeggios, octave leaps and chromatic walks trigger different tricks.
See [Free play companion behavior](explore-transcription.md#musical-companion-discoveries).
Companion presentation cannot advance practice, capture notes or award currency.
Reduced motion keeps the companion/reaction symbols and suppresses movement.
Accessories are drawn in the same coordinate
space, so previews match the worn outfit. Blinking and the short equipment
entrance respect reduced motion. The original vector art is MIT-licensed.

| Find                                     | Price               |
| ---------------------------------------- | ------------------- |
| Cat friend / Bunny friend                | 18 / 30 hearts      |
| Bird friend / Frog friend / Panda friend | 42 / 60 / 96 hearts |
| Party bow / Star charm                   | 12 / 24 hearts      |
| Cosy scarf / Daisy crown / Golden crown  | 18 / 24 / 48 hearts |
| Sunny shades / Cherry earrings           | 36 / 40 hearts      |
| Puddle hat / Rainbow bow tie             | 54 / 64 hearts      |
| Jam headphones / Rainy-day coat          | 80 / 100 hearts     |
| Adventure bag / Wizard hat               | 120 / 160 hearts    |
| Moon pendant                             | 2 gems              |
| Puppy friend                             | 3 gems              |
| Starlight cape                           | 4 gems              |
| Butterfly wings                          | 5 gems              |
| Crystal crown                            | 6 gems              |
| Little dragon                            | 8 gems              |
| Witch hat                                | 36 hearts           |
| Bat wings                                | 60 hearts           |
| Pumpkin suit                             | 48 hearts           |
| Ghost charm                              | 18 hearts           |
| Pumpkin pail                             | 30 hearts           |
| Vampire cape                             | 72 hearts           |

The six Halloween pieces are original vector artwork with the same preview,
thumbnail and equipped rendering as the existing collection. A Halloween filter
groups their catalog theme tags; each also appears in its ordinary wear-position
category. They cost earned hearts, remain available year-round and stay owned
after taking them off. Witch hat uses headwear, pumpkin suit uses body, ghost
charm uses necklace, pumpkin pail uses bag, and bat wings/vampire cape share the
back position. Choosing one replaces only that position, preserving compatible
pieces. Wings and cape fabric sit behind the companion; the cape collar and
other pieces follow the existing front layer order. The full outfit works on
all eight friends and follows the learner into piano activities.

One friend can wear up to eight compatible pieces. Wear positions are headwear
(bows, flowers, crowns and hats), eyes (sunglasses), ears (earrings or headphones),
neck (scarf or bow tie), charm (star or moon necklace), body (raincoat), bag
(satchel), and back (cape or wings). Selecting or buying a different piece in one
position replaces only that position. Clothes render beneath necklaces and bags;
backdrops sit behind the companion; face details and headwear stay on top.
`Pet.tsx` and `PetAccessories.tsx` share this renderer across previews, home,
headers and every activity. Gallery accessory thumbnails show each individual
piece on the current friend, while the stage shows the combined outfit.

The optional learner `accessories` array stores the outfit. An absent array falls
back to the earlier `charm` field; an explicit empty array means no accessories.
Equipment changes normalize known IDs to one piece per wear position, persist
the array, and retain `charm` as a compatibility projection of a selected/worn
piece. No IndexedDB version bump or destructive migration is required. Purchases,
individual removal, friend changes and outfit updates operate on the current
learner inside the existing transaction, preserving other compatible pieces even
when separate browser tabs buy/equip concurrently. Ownership is still checked
before equipping, and preview data never enters the learner repository.

Existing stable IDs, prices, purchases and equipment remain valid. Gems come from
first stars and repeatable mistake-free lesson sets. Every gem reward, including
the 8-gem dragon, can be collected through play. Hearts remain replayable too.
There are no paid or random purchases.
The Progress tab pages through exercise stars, recent single-note evidence and earlier achievements.

## Lessons and progress

The active browser has Find notes (Garden), Scales (Meadow), Patterns (River) and
Coming soon. Every implemented exercise is immediately selectable. Cards show
best stars, pitch/pattern descriptions, set length where space allows, and a next
star goal. Four cards fit a page, or two on narrow/short phones; paging keeps the
complete browser within the viewport. Home and the persistent ← Lessons button
remain available, and returning reopens the chosen group.

All active exercises show note names. The three former Read notes lessons and
Quick are no longer selectable. Their stable IDs remain in `legacyLessons`;
`mergedLessonId` maps them to the corresponding Find notes range. This is one
exercise progression, with no support-based duplicate ratings.

The active catalog has 21 exercises: three isolated-note ranges; four five-note
walk/full C-scale lessons; and fourteen patterns. New patterns are repeated
notes, neighbours returning home, mixed steps/skips, broken chords out and back,
and moving fifths. Notes stay on white keys from C4 to C5. Full scales have one
written shape repeated twice; other pattern sets have two shapes repeated twice.
Each isolated-note set visits each pitch twice. Pattern decks preserve intact
shapes. See [pattern content and feedback](note-hunt.md#pattern-hunt).

### Three stars

A complete set must contain every expected index and pitch, with every written
pattern intact. Partial or combined runs cannot qualify.

| Rating | Requirement                                                     |
| ------ | --------------------------------------------------------------- |
| ★      | Complete the set with at least 60% of its maximum hearts.       |
| ★★     | Complete the set with every pitch correct on its first attempt. |
| ★★★    | No mistakes and every target found within the fluency limit.    |

Maximum hearts is note count × three × the lesson's heart multiplier. This keeps
the first-star percentage comparable across lengths and historical multipliers.
The fluency limit is 4,000ms for isolated notes and the first note of each pattern,
then 2,000ms for subsequent notes. These are starting playtest parameters, not
validated learning-efficacy thresholds. Names and idle hints do not affect stars.
There is no countdown, timeout, failure screen or rhythm requirement. Completion
below 60% still retains hearts. A replay cannot reduce a personal best.

Fluency has a separate response clock. It starts once the staff/target is ready,
and excludes held-key time and between-pattern/card celebrations. Early connected
attacks are accepted immediately. Settings, blur and visibility interruptions
invalidate the affected response for the third star, without invalidating the
no-mistakes rating or gem. The ordinary response clock remains separate for
historical and adaptive evidence. `fluentResponseMs` stores the active finding
time; explicit null does not fall back to a different timer.

### Currency and saved progress

Active revision-two exercises award their first-star gem once, using the existing
achievement ledger. The first qualifying star grants the catalog gem amount
(currently one). An earlier badge from any merged variant already satisfies this
milestone, preventing another first-time payout. Earlier badge entries, including
original gem amounts, are never removed or rewritten. Every complete mistake-free
set also grants one run gem, including replays and three-star runs. The third star
does not add a separate repeatable currency reward. Hearts remain attempt-based:
3/2/1 on the first/second/third find, zero thereafter.

Results show this run's stars, saved best, next goal, hearts, "First star" gems
and "No mistakes" gems. Options explains the full rules before playing. Profiles
show Exercise stars, Recent finds, Earlier achievements and Stars & gems.

`learner.lessonStars` stores only improvements (lesson ID/revision, run ID, time
and best stars). `learner.runRewards` retains repeatable one-gem awards. Both
commit with the completing encounter in one IndexedDB transaction. Stable
encounter/run IDs make retries idempotent; competing tabs cannot duplicate awards
or overspend. A failed save keeps pending encounters for retry in that tab.

No database upgrade or destructive migration is required. Missing star projections
mean zero new ratings; earlier badges imply at least one star, and saved
no-mistakes run rewards imply two. These fallback ratings use merged lesson IDs,
so equivalent variants cannot multiply the star total. Historical speed is not
invented. New fluent runs can improve these ratings to three. Currency is always
calculated from the original saved awards and purchases, never from inferred
stars, so loading an older save does not mint gems. Old revision-one encounters
and rewards remain readable and valid; older unfinished sets can still save.
New selection starts revision two. Songs, open-ended Free practice and Free play
remain outside lesson-star/run-gem scoring.

### Editing and adding content

`src/lesson-catalog.ts` is the content source. Stable IDs, revisions, worlds,
descriptions, pitches and equal-length pattern arrays define exercises. Active
content lives in `lessons`; original version-one definitions stay in
`legacyLessons` for saved evidence. `lessonById(id, revision)` reads exact old
versions, while ordinary selection uses current versions only. Preserve old
versions when changing assessment meaning and never recycle IDs. Existing
purchases, badges, stars and run rewards stay permanent.

New clefs, signatures and simultaneous notes need their own appropriate renderer
and recognition policy before appearing as playable content. Future worlds are
noninteractive previews. Pattern following does not enter independent single-note
adaptive review/expansion.

Tests cover star boundaries, per-pattern fluency, held-time exclusion,
interruptions, complete decks, repetitions, legacy aliases, permanent bests,
first-time and repeatable gem awards, retries, profile isolation and concurrent
transactions. Browser journeys cover all new exercises, eight-note scale
rendering, repeats requiring fresh attacks, visible names, legacy saves, star
rules/results, reward purchases, ghost/hint feedback and desktop/phone fit.

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
prices, including first-star, earlier badge and run gems; local transactional protection is
not server authority. Prefer merging
immutable encounters/purchases and rebuilding projections over last-write-wins
heart totals. Device calibration stays local. Profile history includes learning
data and should upload only through an explicit account/link flow.

Later curriculum work can extend assisted/unassisted assessment to other clefs
and octaves, and introduce accidentals with their written spellings. F♯ and G♭ share a
piano key but are separate notation concepts. Additional activities can consume
the same learner identity and reward ledger while maintaining their own skill
evidence and policies.
