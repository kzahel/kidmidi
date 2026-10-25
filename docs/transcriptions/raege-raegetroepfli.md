# Räge-Rägetröpfli — source transcription

Source: owner's photograph of songbook page 17, supplied 2026-10-25.
The original JPEG is preserved unchanged at `public/book/rain-source.jpg`.
SHA-256: `c9bced1b368188609eeeff2fe5826db8b1aefb8b67244a9a386a27187077e3fb`.

Transcribed directly from that image, without looking up another arrangement.
Printed credits: C. Ruckstuhl above, I. Spühler-Suter below; MusicXML uses
composer and lyricist roles respectively, inferred from their placement.

This document records transcription provenance, not a public-domain or
open-content declaration for the song, lyrics, arrangement or illustration.
Those materials, the source photograph and generated score are excluded from
Kidmidi's MIT software license. Their redistribution rights are not established
by this transcription record. The project's future repertoire direction is
[folk and public-domain music with explicit provenance](../product-direction.md).

Treble clef, D major (F♯ and C♯), 2/4, 12 measures, 45 melody attacks.
The 42 eighth notes remain individually flagged, with original stem directions;
three quarter notes are at m2/beat1, m4/beat1 and m12/beat2. No rests, slurs,
ties, dynamics or repeat signs appear in this song. Preserve the final thin/thick
barline and all 13 printed chord symbols. No accompaniment notes are invented.

| Bar | Written pitches | Values                  | Printed chords (quarter-note beat) |
| --- | --------------- | ----------------------- | ---------------------------------- |
| 1   | A4 G4 F♯4 E4    | eighth × 4              | D (1), A (2)                       |
| 2   | F♯4 D4 D4       | quarter, eighth, eighth | D (1)                              |
| 3   | A4 G4 F♯4 E4    | eighth × 4              | A (2)                              |
| 4   | F♯4 D4 D4       | quarter, eighth, eighth | D (1)                              |
| 5   | B4 B4 D5 B4     | eighth × 4              | G (1)                              |
| 6   | B4 A4 A4 F♯4    | eighth × 4              | D (1)                              |
| 7   | A4 G4 G4 E4     | eighth × 4              | A (1)                              |
| 8   | G4 F♯4 F♯4 D4   | eighth × 4              | D (1)                              |
| 9   | B4 B4 D5 B4     | eighth × 4              | G (1)                              |
| 10  | B4 A4 A4 F♯4    | eighth × 4              | D (1)                              |
| 11  | A4 G4 G4 E4     | eighth × 4              | A (1)                              |
| 12  | D4 F♯4 D4       | eighth, eighth, quarter | D (1)                              |

Swiss German lyrics, punctuation and note-to-syllable assignments live in
`src/rain.ts`. The first “wer-ded” and second “wer-det” are retained as printed.
Hyphens become MusicXML syllabic markers, rather than literal trailing dashes.
Each practice phrase corresponds to a printed three-measure line. The whole-song
view and download keep the four original system groups. Practice excerpts repeat
the key and meter for context; only the final excerpt has the final barline.

The on-screen illustration is an SVG viewport onto the unchanged source photo,
showing the houses, rain, child, fence, and flowers. It is not regenerated art.
“Book photo” opens the complete source, including the original layout and marks.

`npm run scores:export` reproduces the downloadable MusicXML from the same data
used by the interactive score. Builds check that download against current data.
Practice checks melody pitches only; chord symbols are displayed for reference,
and preview plays the melody at a convenient demonstration tempo (not source tempo).

Validation: measure totals and pitch/duration boundaries are checked below the
browser; the browser parses the download as XML and exercises the rendered
score/illustration, whole-song cursor, and phone layout. Visual comparison uses
the preserved photo and actual OSMD rendering.

2026-10-25 check: all four unit tests and all four browser tests pass, along with
TypeScript, Biome, production build, and downloadable-score freshness checks.
The complete desktop score and a 390px phone phrase render were compared against
the source. No melody attacks were added, omitted, merged or transposed.

Switching scores now removes each renderer's dedicated mount after clearing it.
OSMD's clear operation alone leaves an empty SVG page; reusing that container
previously accumulated blank layout space. Browser coverage checks that switching
whole-song/phrase views keeps a single SVG page and bounded excerpt height.

The display control is now named Multiline and is available for all songs.
Compact/Kid changes engraving size without changing the transcribed score or
MusicXML download. The full displayed page fits the available width and height
without scrolling. Multiline shows one or two printed line groups per page
depending on screen size and advances with played-note feedback. Target cursors
are faint idle hints, visible only after a pause, not continuously advancing prompts.
