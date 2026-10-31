# Picture-first play and backdrops

Design most child-facing UI so a child around three can explore with a parent
without needing to read. These are design choices for family playtesting, not a
claim that icons alone establish usability. Keep accessible names and short real
text labels. Prefer familiar pictures, stable control positions, immediate
reversible previews, and a small number of visible choices. Keep note names
visible. Put detailed rules and adult controls in Options, Progress and Settings.

## Navigation and choosing music

Home has three illustrated activity cards: a star for songs, a piano for free
play, and a magnifying glass over notes for Note hunt. A wardrobe beside the pet
opens the shop directly; the matching header wardrobe works from all activities.
Home stays at the top left. A separate left arrow returns from a lesson to its
group. On phones the house and arrow remain visible while their long labels are
omitted. Profiles and detailed progress remain under the learner button.

Song cards use recognizable star, bun and rain drawings. Their separate speaker
buttons play the first phrase through the global sound route, without advancing
practice or recording anything. Only one preview plays at once. Stop, live note
input, navigation, a dialog, output changes, blur or unplugging cancels playback.
Quiet stays quiet. MIDI echo suppression uses the existing preview policy.

Lesson cards show their actual pitch contour, short title and best stars.
Single-note ranges show the available notes; patterns connect notes in their
written order. The pictures are navigation aids, not a replacement for the full
practice score. Options and adult Progress retain exact star requirements.
Connection instructions live in Settings → Keyboard rather than occupying
the main play screen with a paragraph.

## Wardrobe

The direct Wardrobe has only its wallet, picture categories, preview and gallery.
The older Learners & rewards entry retains its adult Learners and Progress tabs.
Friends, Dress up and Places are explicit picture buttons. Accessory filters use
pictures and short labels, three at a time with a large paging arrow. On/Yours
checks and selection borders distinguish equipment, ownership and the current
preview without relying on color alone. Galleries scroll; preview and action
stay fixed. Get is an explicit purchase, Use equips owned items, and Off removes
an accessory. Merely tapping a gallery picture never spends or equips.

Places offers original MIT vector drawings using the same scene component in
previews, thumbnails, home, song selection and the piano companion dock:

| Place         | Price     |
| ------------- | --------- |
| Meadow        | Free      |
| Treehouse     | 60 hearts |
| Moon garden   | 3 gems    |
| Underwater    | 4 gems    |
| Spooky castle | 5 gems    |

Scenes stay behind the pet, outside the notation and piano. The small header
avatar keeps its simple silhouette. Backdrops are permanent purchases in their
own equipment slot, independent from clothing and friends. A missing or null
`learner.backdrop` uses Meadow, so older saves need no database upgrade. Returning
to Meadow and re-equipping an owned scene cost nothing. The existing transaction
and idempotency checks protect both wallets. Each learner has their own scene.

## Optional spoken help

A speaker Help button appears only when Web Speech exposes an installed English
voice (`localService`). It speaks a short contextual instruction on explicit tap;
it never reads automatically or uses a network voice. If no suitable installed
voice exists, picture navigation and text still work. Speech stops on navigation,
component removal, blur, hiding the page, or a fresh live attack. Starting a song
preview stops speech, and asking for help on song selection stops the preview.
Voice availability and pronunciation depend on the device; the browser checks
use a deterministic mock, not a claim about a particular device's installed TTS.

## Validation

Node tests cover all backdrop prices, wallet separation, permanent ownership,
free reset, equipment validation and independent outfits. Browser journeys cover
preview versus purchase, re-equipping/reload, per-learner isolation, contextual
speech, song preview cancellation and fresh song position. Desktop, phone, small
phone and landscape screenshots check home, songs, lessons and the shop. Existing
MIDI, lesson feedback and reward journeys continue to exercise the same practice
and persistence paths. Observe a child finding an activity, trying/equipping an
item and returning to play to evaluate whether the pictures are understood.
