# Kidmidi: long-term direction

Kidmidi is a long-term, open and extensible piano playground, growing through
regular use by a family with a two-year-old and a six-year-old. The aim is to
make music together, keep it playful, and build something families and teachers
can trust, contribute to and keep using. Goodwill and usefulness guide the project.

This document records product intent. Age-specific experiences, additional
content, account services and payments described below are future directions,
not a list of features already implemented. See [README](../README.md) for the
current application and [curriculum](learners-and-curriculum.md) for current rules.

## Play that grows with the child

Design for different interests and abilities, rather than one course with smaller
buttons. These are starting hypotheses for family playtesting and teacher review:

- **Around two:** shared discovery with a grown-up, immediate musical responses,
  playful sounds, imitation and very short invitations to explore. Reading,
  completing a lesson and earning a badge should not be prerequisites for enjoying
  the piano. Trying a sound and playing together can be the whole activity.
- **Around six:** familiar songs, small achievable challenges, choices, collection
  and discovery, with a gentle route into independent note reading. Rewards can
  support curiosity and a sense of progress; revisit their usefulness during play.
- **As learners grow:** extend repertoire, reading and musical understanding while
  keeping free exploration and parent/teacher participation available.

Age is a design reference, not a hard gate or a claim about what every child
should achieve. Grown-ups should be able to choose the appropriate support and
challenge. Preserve patient, pitch-only song practice; keep game assessments and
rewards separate. Avoid punishment, pressure to maintain a streak, or rewards
that make stopping difficult.

Experienced piano-teacher advice is available to shape progression, arrangements
and feedback. Use that advice alongside actual family sessions to review one
small change at a time. Record teaching suggestions, observations and proposed
adjustments separately; a numerical badge threshold alone does not establish
learning.

## Repertoire and contributions

Focus on folk tunes, traditional songs and public-domain repertoire, with clear,
approachable arrangements and room for different languages and family traditions.
Favor a carefully prepared collection that works well for young learners over
catalog size. Familiar music should work for singing and co-play as well as
notation practice.

Record provenance and explicit rights information for contributed melodies,
lyrics, arrangements, images and recordings. Do not label the existing catalog
as entirely public domain: the current songbook transcription has its own
[source and licensing boundary](transcriptions/raege-raegetroepfli.md). New open
content should state its terms alongside its source; the code license is not a
blanket license for every bundled asset.

## Openness and portability

Original Kidmidi software and documentation use the [MIT license](../LICENSE).
Keep the core runnable independently and extensible by other families, teachers
and developers. Document content formats and extension points as they stabilize;
prefer small, understandable boundaries over an early general-purpose plugin
framework. MIDI transport, practice recognition, content, learner storage and
feedback should remain separable.

No lock-in means practical choices: editable scores, documented and versioned
data formats, and a path to take recordings, content and learner history elsewhere.
Recording JSON and MusicXML export already exist. Complete learner export/import,
independent content packs and other extension interfaces remain work to design
and implement; do not imply they are available today.

## Optional accounts and support

Local play is the foundation. Accounts, if introduced, are optional conveniences
for adults, such as syncing or backing up multiple learners. Ordinary play and
access to local work should remain usable without signing in. Moving to or from a
hosted service should preserve a usable local copy and an export path. Children
should not need their own email addresses. See the
[account architecture direction](learners-and-curriculum.md#eventual-hosted-accounts).

A paid offering may help sustain the project eventually. A voluntary thank-you
purchase, donation or optional hosted service is a possibility, not a decided
business model. No price, billing schedule or paid feature set is committed.
Support requests and payment decisions belong with grown-ups; earned hearts,
gems and curriculum gates remain game mechanics, separate from real money.
Preserve the open core, optional accounts and data portability when evaluating
any paid service. First make something families enjoy and trust over time.
