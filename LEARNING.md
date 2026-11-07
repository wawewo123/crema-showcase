# Crema — what this round decided, and how to push it further

This note is for learning how to steer an AI build. It is about the dark ceramic redesign, not a file tour.

## What you approved, and what that did not yet prove

The Brew and Journal pictures were a look, not a prototype. They showed materials, hierarchy, and mood. They did not move, and they did not prove a browser could draw the crema. The build treats them as the target and keeps the old behaviour underneath: the same four presets, the same slider limits, the same ratio / flow / style / verdict maths, the same checklist, the same eight-shot session log, and the same fictional starter cafés.

Two faults in the pictures were fixed in the app rather than copied:

- The ring now says which mark is time and which is yield.
- The selected map pin and the place card use the same photograph.

Grey label text on the near-black ground is `#d5cbbf` on `#14110f`, checked in a unit test at 4.5:1 or better. The stills’ dimmer grey was not reused.

## Why the cup is Canvas 2D

Three ways were on the table.

| Approach | What you get | What it costs |
|---|---|---|
| Canvas 2D, chosen | One crema texture, painted once, then a cheap blit. A slow drift while you watch. A still frame when the system asks for reduced motion, when Brew is off-screen, or when the tab is hidden. An SVG cup if the canvas context is missing. | It will not match a photograph pixel for pixel. |
| WebGL shader | Finer noise, closer to the still. | More battery risk on a phone, and a harder failure mode when the GPU context drops. The design notes already called this unproven. |
| Image sequence | A predictable pour. | Heavy inside the single HTML file, and it cannot tint slightly as yield changes. |

The pour fills the cup in about 1.4 seconds, then the surface barely drifts. Dragging a slider does not replay it. Yield only nudges the highlight. The cup is full at rest on purpose: an overhead espresso photo is a full cup, and a half-empty picture would pretend to be a volume model. The sentence in the detail sheet says the cup and the curve follow your numbers and do not measure extraction.

Framer Motion still handles small UI motion. GSAP still plays the chart pour, and only when that sheet is relevant. Reduced motion skips both.

## Why the journal is stored this way

`localStorage` is about 5 MB, which one phone photo can fill. Photos are resized in the browser to a 1080 px JPEG and a 160 px thumb of that same image. The document lives in IndexedDB (`crema` / `journal`). A copy of the names, dates, and coordinates, without the pictures, is mirrored to `localStorage` key `crema.journal` so a failure in IndexedDB does not erase the list. If IndexedDB itself is missing, the full document falls back to `localStorage` and a full-disk message is shown.

Version 1 journals (the previous app’s shape) are read and promoted. A stored `demo: true` flag is stripped, because sample cafés are not your history and are never written. Unreadable data is copied to `crema.journal.backup` and the app opens empty instead of crashing.

Export downloads a JSON file with your visits and their photos. Import replaces the on-device journal only after the file validates (version, ids, coordinates, dates, JPEG/PNG/WebP data URLs, under 12 MB). A bad file changes nothing. Clear asks first and reminds you there is no account to restore from.

The map is still Leaflet and OpenStreetMap, graded dark with CSS, with no API key. Pins that would overlap cluster, and the badge is the real count. The selected café is always its own pin, using the full photo the card uses. **Open in Maps** is an ordinary Google link. Tiles are not cached by the service worker. If they cannot load, the pins and the list remain and a note says the map needs the internet.

## The cup was too small, and why

The first phone screenshot put a 104 px canvas in the top-left of a 329 px ring. Measuring the boxes showed two separate mistakes. The canvas width was 54% of its wrapper, so it sat at the start of that box instead of in the middle. The ring was a square taller than the space above the controls, so the grid pinned it to the top and the visible part was an empty arc. The fix is one square that fits the width and the height (`min(100cqw, 100cqh)`, at least 250 px tall), with the ring filling that square and the cup centred at 82% of it. At 375, 390, and 402 px wide the cup centre and the ring centre now match, and the canvas is about 250–270 px. A 667 px-tall screen scrolls a little so the cup does not shrink back down.

The crema texture is a 480 px image built once: curved streaks, fine speckles, and small bubbles, drawn near 1:1 so it is not a magnified blur. It is still an illustration. It will not match the photograph in the approved still.

## What was verified, and what was not

Commands that passed in this workspace:

- `npx vitest run` — 28 tests: presets and flow, verdict sentences, curve endpoints, contrast, cup loop policy, v1 migration, export/import rejection, pin/card photo identity, clustering, month filter, IndexedDB fallback, Google Maps links, preset and slider controls, the detail sheet.
- `npx oxlint src` — no errors.
- `npm run build` — `dist/index.html` about 689 KB (about 225 KB gzipped), plus `dist/sw.js`, the manifest, and icons.
- `node scripts/smoke.mjs` — system Chrome, not a phone. Viewports 390×844, 375×667, and 402×874 had no horizontal overflow on Brew or Journal. Pour set the cup to a live loop; reduced motion kept a still. A visit with a photo survived reload, the selected pin matched the card, edit renamed it, the service worker activated on localhost, an offline reload still showed Brew, and the journal then explained that tiles need the internet.

That Chrome pass is emulation. It does not tell you how warm the phone gets, whether the crema holds 60 fps, or how the notch insets feel in the hand. `env(safe-area-inset-*)` is in the header and the tab bar, and those insets were 0 in this emulator. A physical iPhone is still the check that matters for the pour.

GitHub Pages was not attempted. The earlier token could only read repository metadata. The existing here.now preview was not touched.

## How to ask for the next change

Name one thing, the constraint, and the check. Examples you can paste:

> In Crema’s Brew screen, make the crema drift slower and the ring arc start at the bottom. Do not change `src/lib/brew.ts`. Show an iPhone-width screenshot after the pour has finished, and say whether it was a real phone or an emulator.

> In the journal, let a visit hold three photos and swipe them in the card. Keep the selected pin on the same photo as the card. Resize each one. Extend the backup tests so a round-trip keeps all three.

> Run the built file on my iPhone and tell me if the pour stays smooth and if the tab bar clears the home indicator. Do not change code unless something is actually broken.

What worked on this round: the pictures were treated as approved, the maths file was frozen, demo data stayed labelled, and screenshots were required before calling the look done. When something is off, point at the moment (“the curve is a brown block”, “the pin photo is not the card photo”) rather than at a mood.
