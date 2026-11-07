# Crema redesign implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a mobile-first Crema that matches the approved dark ceramic Brew and photo-map Journal, keeps the existing brew maths and journal behaviour, and still builds to one HTML file.

**Architecture:** Vite + React + TypeScript. Brew maths stay in `src/lib/brew.ts`. The cup is a Canvas 2D texture with an SVG ring. Chart, checklist, and the session log move into a dialog. The journal document is version 2 in IndexedDB, with a localStorage mirror and a pure migrate/import layer under test. Leaflet + OSM stays the map.

**Tech Stack:** React 19, TypeScript, Vite 8, vite-plugin-singlefile, Framer Motion, GSAP, Leaflet, Vitest 5, jsdom, Testing Library, system Chrome via puppeteer-core for the mobile smoke pass.

The approved spec is `docs/superpowers/specs/2026-11-07-crema-redesign-design.md`. This session implements the plan inline because the request already says to build now.

## Global Constraints

- Do not change formulas, preset numbers, limits, checklist copy, or `verdict()` strings in `src/lib/brew.ts`.
- Do not edit `legacy/original-showcase.html`.
- Do not call the GitHub Pages API, create a host, or write to `https://patient-prism-6amz.here.now/`.
- Label simulation once (Simulated pill) and seeded cafés once (Demo pill plus “Demo visit” on a demo sheet).
- Text contrast ≥ 4.5:1. Tokens: ground `#14110f`, label `#d5cbbf`, primary text `#f4efe8`, amber `#e0b07a`, cream button `#f0d7b8` with `#2a2118` text.
- Touch targets ≥ 44px. `font-size` on inputs ≥ 16px. Safe-area insets on the header and tab bar.
- Reduced motion: still cup, no GSAP pour, no pin animation, map jumps.
- Cup loop pauses when the Brew tab is hidden, the cup is off-screen, or the document is hidden.
- Selected pin `src` equals the card `src` (`visit.photo`).
- Import of an invalid file changes nothing. Demos are never written to storage.
- `npm run build` must still produce a double-clickable `dist/index.html` (`base: './'`, vite-plugin-singlefile).
- If `git push` or PR creation returns a permission error, stop. Do not try another token.

## File structure

- `src/lib/brew.ts` — unchanged maths.
- `src/lib/brew.test.ts` — presets, flow, verdict, `yieldAt`.
- `src/theme/tokens.ts` — colour tokens and contrast helper.
- `src/theme/tokens.test.ts` — contrast floor.
- `src/components/cup/policy.ts` — loop and pour easing. Pure.
- `src/components/cup/drawCup.ts` — canvas drawing.
- `src/components/cup/CupStage.tsx` — canvas loop, fallback, pause.
- `src/components/RingGauge.tsx` — labelled time arc and yield dot.
- `src/components/Brew.tsx` — instrument screen.
- `src/components/DetailDrawer.tsx` — chart, stats, checklist, log.
- `src/components/ShotChart.tsx` — existing pour, dark-drawer colours via CSS.
- `src/components/Brew.test.tsx` — presets and sliders.
- `src/journal/migrate.ts` — migrate, export, import validation. Pure.
- `src/journal/repo.ts` — IndexedDB + localStorage mirror.
- `src/journal/cluster.ts` — zoom clustering.
- `src/journal/pins.ts` — which image a pin or card shows.
- `src/journal/months.ts` — timeline ticks and filter.
- `src/journal/storage.ts` — resize, Google Maps URL, ids.
- `src/journal/Journal.tsx`, `VisitForm.tsx`, `MapView.tsx` — UI.
- `public/sw.js`, `public/manifest.webmanifest`, `public/icons/` — PWA shell.
- `scripts/smoke.mjs` — emulated iPhone overflow, pour, journal, offline.
- `LEARNING.md` — what was decided and how to iterate.

## Interfaces later tasks share

```ts
// src/components/cup/policy.ts
export function shouldRunCupLoop(o: {
  active: boolean
  visible: boolean
  reduced: boolean
  canvas: boolean
  hidden: boolean
}): boolean
export function pourFill(elapsedMs: number, durationMs?: number): number

// src/journal/migrate.ts
export type JournalState = { version: 2; showDemos: boolean; entries: Visit[] }
export function emptyState(): JournalState
export function migrateRaw(data: unknown): MigrateResult
export function exportDocument(state: JournalState, nowIso: string): string
export function validateImport(data: unknown, rawLength: number): ImportResult

// src/journal/pins.ts
export function pinImageSrc(v: Visit, selected: boolean): string | undefined
export function cardImageSrc(v: Visit): string | undefined

// src/journal/cluster.ts
export function clusterVisits(visits: Visit[], zoom: number, selectedId: string | null): Pin[]

// src/journal/months.ts
export function monthTicks(visits: Visit[]): { key: string; label: string }[]
export function filterByMonth(visits: Visit[], key: string): Visit[]

// src/journal/repo.ts
export type JournalRepo = {
  load(): Promise<JournalState>
  save(s: JournalState): Promise<{ ok: true } | { ok: false; reason: string }>
  clear(): Promise<void>
}
export function createRepo(blobs: BlobStore, mirror: Storage): JournalRepo
```

---

### Task 1: Maths tests

**Files:** Create `src/lib/brew.test.ts`. Do not modify `src/lib/brew.ts` unless a test proves a bug in the port (there is not one).

- [ ] **Step 1: Write the test**

```ts
import { describe, expect, it } from 'vitest'
import { PRESETS, chartGeom, flow, preInf, styleLabel, verdict } from './brew'

describe('brew maths', () => {
  it('keeps the four presets', () => {
    expect(PRESETS.map((p) => [p.id, p.d, p.y, p.t])).toEqual([
      ['classic', 18, 36, 28],
      ['ristretto', 18, 24, 24],
      ['turbo', 18, 45, 15],
      ['lungo', 17, 51, 34],
    ])
  })

  it('computes classic flow after a 6s pre-infusion', () => {
    expect(preInf(28)).toBe(6)
    expect(flow({ d: 18, y: 36, t: 28 })).toBeCloseTo(36 / 22, 5)
    expect(styleLabel(2)).toBe('Normale')
  })

  it('uses the turbo verdict for a fast long shot', () => {
    expect(verdict({ d: 18, y: 45, t: 15 })[0]).toBe('Fast & long')
  })

  it('holds yield at 0 through pre-infusion and at the full yield at the end', () => {
    const s = { d: 18, y: 36, t: 28 }
    const g = chartGeom(s)
    expect(g.yieldAt(0)).toBe(0)
    expect(g.yieldAt(g.pi)).toBe(0)
    expect(g.yieldAt(s.t)).toBe(36)
  })
})
```

- [ ] **Step 2: Run** `npx vitest run src/lib/brew.test.ts` and expect pass (the module already exists).

### Task 2: Tokens, cup policy, journal pure functions

**Files:** `src/theme/tokens.ts`, `src/components/cup/policy.ts`, `src/journal/migrate.ts`, `pins.ts`, `cluster.ts`, `months.ts`, and their `*.test.ts` files.

- [ ] Write failing tests for contrast ≥ 4.5, `shouldRunCupLoop` false when reduced / hidden / off-tab / off-screen, `pourFill(0) === 0` and `pourFill(1400) === 1`, v1 migration stripping `demo`, invalid JSON not crashing, export/import round-trip, import rejecting a bad latitude and leaving the caller to abort, selected pin src === card src, two visits 0.01° apart clustering at zoom 6 while the selected id stays single, and `monthTicks` starting with `All`.
- [ ] Implement the pure modules until `npx vitest run` is green.
- [ ] Repo test: `createRepo` loads a v1 localStorage document, writes the blob store, and a throwing blob store falls back to the mirror.

### Task 3: Cup, ring, Brew screen, drawer

**Files:** cup drawing and stage, `RingGauge.tsx`, rewrite `Brew.tsx`, add `DetailDrawer.tsx`, restyle `ShotChart` only through CSS classes, delete the hero from the shell.

- [ ] `Brew.test.tsx`: clicking Ristretto sets the yield number input to 24 and the time slider to 24. Changing the yield slider updates the readout. “Curve, checklist and log” reveals “Purge group & dry basket” and “Log this shot”.
- [ ] Canvas draws a cached crema texture, ceramic rim, and shadow. Loop follows `shouldRunCupLoop`. `data-cup-mode="live"|"still"`.
- [ ] Ring exposes an accessible name containing the seconds and the grams, plus visible Time and Yield labels.
- [ ] Main column matches the spec order. No chart on the first screen.

### Task 4: Journal UI, photos, backup

**Files:** `storage.ts` resize to 1080 + thumb 160, `Journal.tsx`, `VisitForm.tsx`, `MapView.tsx`, `repo.ts` wired as `browserRepo()`.

- [ ] Add and edit call `upsert`. Demos have no Edit or Delete.
- [ ] Map clusters, same-photo selection, month radios defaulting to All, offline note, Google Maps link.
- [ ] Export / import / clear with the local-only sentence visible under Add coffee.
- [ ] Unit tests from Task 2 cover validation. Do not mount Leaflet in Vitest.

### Task 5: Shell, PWA, single-file build

**Files:** `App.tsx`, `index.css`, `index.html`, `public/sw.js`, manifest, icons, `src/pwa/register.ts`.

- [ ] Bottom tabs, hash routes, skip link, safe areas, debounced live region.
- [ ] Service worker caches `./index.html`, the manifest, and icons. It does not handle `tile.openstreetmap.org`.
- [ ] `npm run build` emits `dist/index.html` plus `dist/sw.js` and icons.

### Task 6: Emulated iPhone smoke

**Files:** `scripts/smoke.mjs` using system Chrome (`puppeteer-core`), not a device.

- [ ] Viewports 390×844, 375×667, and 402×874: `scrollWidth <= clientWidth + 1` on Brew and Journal.
- [ ] Reduced motion: cup `data-cup-mode="still"`.
- [ ] Add a visit named “Test Café” with a tiny PNG, reload, see it, edit the name, see the card image src equal the selected pin src.
- [ ] Offline reload still shows Brew; Journal shows the tiles message.
- [ ] Write screenshots into the artifact folder.
- [ ] Record in `LEARNING.md` that this was emulation, not a physical iPhone.

### Task 7: Docs and source control

- [ ] `LEARNING.md` and `README.md` describe run, test, backup, and iteration.
- [ ] Commit on `cursor/crema-redesign-943a`. Push only with the existing credential. Open a PR only if push succeeds.

## Spec coverage check

| Spec requirement | Task |
|---|---|
| Unchanged maths, presets, verdict | 1 |
| Contrast tokens | 2 |
| Cup canvas, pause, reduced motion, SVG fallback | 2, 3 |
| Labelled ring | 3 |
| Drawer chart, checklist, session log | 3 |
| Journal add/edit/save, photos, map, cluster, timeline | 4 |
| Pin/card same photo | 2, 4 |
| Migration, export/import, clear, local-only copy | 2, 4 |
| PWA shell, single-file dist, no tile cache | 5 |
| Emulated mobile overflow | 6 |
| No Pages, legacy file preserved | 7 |
| Physical iPhone called out as not done | 6, 7 |

## Placeholder scan

No task says “implement later” without a file and a check. UI polish that depends on a screenshot is Task 6’s explicit tuning step, not an open product question.
