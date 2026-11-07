# Crema redesign — approved design

Status: approved. The Brew and Journal stills were accepted, and the request is to build a usable app now. This spec locks the decisions those stills left open. It is the source of truth for the implementation plan.

The old compiled showcase stays untouched at `legacy/original-showcase.html`. Brew maths stay the v1/v2 formulas in `src/lib/brew.ts`. No Pages deploy, no hosting account, no write to the existing here.now preview.

## Product

Crema is a mobile-first espresso workflow toy and a private café journal.

- No accounts, no backend, no payments, no API keys.
- Brew numbers, the curve, and the cup motion are a **simulation of the interface**, not a prediction of extraction, taste, or grind.
- Seeded cafés are fictional. The app must not invent a personal history.
- Honesty is compact: one **Simulated** pill on Brew, one **Demo** pill on Journal while sample cafés are showing. Demo sheets say “Demo visit · {Mon}”. The curve keeps a single “illustrative only” line inside the detail drawer.

## Visual direction

Dark, warm, matte, quiet. Near-black ceramic ground (`#14110f`), one crema-amber accent (`#e0b07a`), cream controls (`#f0d7b8` / `#f3e6d4`). Serif wordmark, system sans for UI, tabular numbers. No neon, no dashboard cards, no equal-weight brochure sections.

The phone layout is the product. Wide windows centre a single column (max 430px) on a darker field. Narrow windows are full-bleed, including the notch via `viewport-fit=cover` and `env(safe-area-inset-*)`.

### Brew screen (top to bottom)

1. Wordmark “Crema” and the Simulated pill.
2. Overhead cup with a ring gauge around it. Numbers sit **under** the cup, never on the liquid: `36.0 g` and `28 s`, caption `YIELD · TIME`.
3. Preset chips: Classic, Ristretto, Turbo, Lungo. Short labels; full preset name and blurb stay available to assistive tech.
4. Dose, Yield, and Time on one card. Each row is label, editable value, slider. Same limits as v2 (`src/lib/brew.ts` `LIMITS`).
5. Cream **Pour** button.
6. A quiet control that opens the detail drawer.
7. Bottom tab bar: Brew, Journal. Targets at least 44px.

The ring is meaningful:

- Amber arc = shot time, mapped across 10–45s.
- Cream dot on the same circle = yield, mapped across 15–70g.
- Visible labels “Time” and “Yield” sit by those marks.
- The SVG name tells a screen reader the seconds, the grams, and that it is an illustration.

Dragging a slider updates numbers, the ring, and the cup’s resting crema tint immediately. It does not replay the pour. Preset, Reset, and Pour do.

### Cup rendering

Canvas 2D, not WebGL and not a 3D engine.

- A crema texture is built once (domain-warped noise, tiger stripes, a few fixed bubbles) and drawn inside a ceramic rim lit from the upper left.
- Pour plays about 1.4s: the surface fills, then a very small idle drift continues.
- At rest the cup is full. Yield only shifts crema lightness slightly. The picture is not a model of volume in the cup, and copy must not claim that it is.
- The loop runs only when the Brew screen is the active tab, the cup is on screen, the document is visible, and `prefers-reduced-motion` is off. Otherwise one still frame is drawn and `requestAnimationFrame` is cancelled.
- If `getContext('2d')` fails, a static inline SVG cup is shown. Reduced motion uses the same still, fully filled, with no drift.

### Detail drawer

Chart, ratio, flow (demo), style, rule-of-thumb verdict, pre-shot checklist, and the 8-shot session log live in a bottom sheet opened from Brew. They are not deleted and not replaced with new coffee science.

- Verdict strings stay exactly the `verdict()` copy.
- The log is still session-only: last 8 shots, cleared only by the user, never written to disk.
- Dragging still redraws the chart immediately. The GSAP pour runs on preset, reset, and Pour, and is skipped when reduced motion is on.
- One polite live region announces the settled ratio, flow, style, yield, and time (debounced), not every animation frame.

### Journal screen

Same materials. Map is the ground. A selected-place card overlaps the lower map. Under it: a month timeline, then **Add coffee**, then the storage sentence, then the tab bar.

Fixes the stills got wrong:

- The selected pin and the card use the same photograph (`visit.photo`). Unselected pins may use a smaller encode of that same picture (`thumb`) so a cluster of pins stays light. Selecting a pin swaps it to the full photo, which matches the card.
- The selected pin is larger, has an amber glow, and a pointer.
- Add coffee is a labelled control in the thumb zone, at least 44×44, docked above the tab bar. It is not a floating control in an empty gap.
- Sample pins are not given a personal history. The Demo pill covers them; cards say “Demo visit”.

Map:

- Leaflet with OpenStreetMap raster tiles, no key. A CSS grade makes the tiles dark and warm. Attribution stays visible.
- Pins that would overlap at the current zoom cluster. The badge shows the real count (not a fake “3”). Activating a cluster zooms until they separate. The selected visit is always its own pin.
- Offline or blocked tiles: a drawn dark grid, a text note that the map needs internet, and pins plus the list still work. Google Maps is a normal link (`googleMapsUrl`), online only.
- The map is not the only way in. **All visits** opens a list sheet (keyboard and screen-reader path) with edit, delete, and backup.

Timeline:

- Radio buttons for `All` plus each month that actually appears in the current visits. Default is **All**, so seeded cafés are not hidden on first open. Choosing a month filters pins and the featured card.

Add / edit / save:

- Add: tap the map or “Drop pin at centre”, then name (required), optional area, date, notes, optional photo. Save writes the journal and selects the new visit.
- Edit: same form for the user’s own visits, including move-pin and replace/remove photo. Demos cannot be edited or deleted.
- Delete asks for confirmation.

Photos:

- Resized in-browser to a longest edge of 1080px JPEG plus a 160px thumb. No upload.
- The journal document lives in IndexedDB (`crema` / `journal`). A metadata mirror without photo blobs is written to `localStorage` key `crema.journal` so names survive an IndexedDB failure.
- If IndexedDB is missing, the full document falls back to `localStorage` and the UI surfaces the quota error the existing `saveJournal` path already described.
- Version 1 documents (`{ version: 1, entries, showDemos }`) migrate in. Stored `demo: true` is forced off (demos are never persisted). Unreadable JSON is copied to `crema.journal.backup` and the app opens empty instead of crashing.

Backup, on the All visits sheet, with this explanation visible also as one line under Add coffee:

> Saved only on this device, in this browser. A home-screen icon does not share storage with the browser tab. Export a backup before you clear data or switch browsers.

- Export downloads pretty JSON (`version: 2`, user entries only, photos included, `showDemos`).
- Import replaces the user journal after a confirm, and only if validation passes: object, version 1 or 2, unique ids, name, finite lat/lng in range, `YYYY-MM-DD`, optional `data:image/jpeg|png|webp` photos, size under 12 MB. A bad file changes nothing.
- Clear removes the journal from IndexedDB and `localStorage` after a confirm that repeats the local-only warning.

## Accessibility

- Contrast at least 4.5:1 for text. Label colour on the ground is `#d5cbbf` on `#14110f` (well above 4.5). Inactive tab text stays at or above 4.5. The stills’ dim grey is not reused.
- Touch targets at least 44px. Inputs use 16px type so iOS does not zoom the page on focus.
- Visible focus, skip link, tablist arrow keys, labelled sliders, `aria-pressed` presets, dialog focus for the drawer and the list sheet.
- `prefers-reduced-motion`: no cup loop, no GSAP pour, no pin-drop animation, map moves jump.

## PWA and the single file

- `npm run build` still emits one self-contained `dist/index.html` via `vite-plugin-singlefile` and `base: './'`, so the file opens from disk.
- `public/manifest.webmanifest`, icons, and `public/sw.js` are copied beside it. The service worker caches the shell only. It does not cache OpenStreetMap or Google.
- Registration is skipped on `file://`. From a local server or HTTPS the shell can reload offline; tiles cannot.
- This build was not installed on a physical iPhone. Browser device emulation is not that test.

## Out of scope

- GitHub Pages and any new host.
- Accounts, sync, Places autocomplete, grind advice, refractometer maths.
- Rewriting `verdict`, `flow`, `chartGeom`, or the preset table.
- Using the concept JPEGs as the app’s chrome or as café photos.

## Approaches considered

1. **Canvas 2D cup (chosen).** One cached texture, a cheap per-frame blit, an obvious still fallback, no extra dependency, safe inside the single-file build.
2. **WebGL shader.** Closer to a filmic crema, worse battery and context-loss story on a phone, and the design notes already flag it as unproven. Rejected for v1 of this look.
3. **Pre-rendered image sequence.** Predictable, but heavy in the single file and poor at matching live yield tint. Kept only as the idea we did not need once Canvas 2D could hold a still.

Map: Leaflet + OSM + CSS grade (chosen) over a keyed vector style. Clustering is our own grid, not another library.
