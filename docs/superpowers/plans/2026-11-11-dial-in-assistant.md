# Dial-in assistant implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an offline Dial tab that starts from the user’s machine, grinder, and beans, times a real brew, and suggests one change.

**Architecture:** Catalog data is a typed module and is never mutated. User overrides, setups, beans, and brews live in IndexedDB. Recipe and suggestion logic are pure functions tested without the DOM. The timer stores an anchor timestamp.

**Tech Stack:** Existing Vite, React, TypeScript, Vitest, IndexedDB, puppeteer-core smoke shots.

The approved spec is `docs/superpowers/specs/2026-11-11-dial-in-assistant-design.md`. Implement on `cursor/crema-redesign-943a`. Do not merge.

## Global Constraints

- Do not change brew maths in `src/lib/brew.ts`.
- Do not invent catalog specs. Unknown fields stay `null` and name a source URL.
- Overrides may fill only null catalog fields and are labelled `added by you`. Sourced values stay `sourced`.
- Custom and override input uses the ranges in the spec.
- Suggestions are one change, from `src/dial/rules.ts`, with no network.
- Timers use timestamps, not accumulated interval ticks.
- Version 1 and 2 journal backups still import and must not wipe dial data.
- Bump the service worker cache so the Home Screen shell updates.
- Do not deploy and do not touch the old here.now preview.

## Tasks

### Task 1: Catalog, validation, overrides

**Files:** `src/dial/catalog.ts`, `src/dial/validate.ts`, `src/dial/overrides.ts`, tests beside them.

- [ ] Catalog entries have unique ids and `https` source URLs.
- [ ] `presentSpecs` marks sourced values and user fills, and ignores an override on a field the source already set.
- [ ] Validators reject out-of-range pressure, portafilter, burr size, and step counts.

### Task 2: Recipe, rules, timer, history

**Files:** `src/dial/recipe.ts`, `src/dial/rules.ts`, `src/dial/timer.ts`, `src/dial/history.ts`, and their tests.

- [ ] Light roast lengthens espresso ratio and raises temperature. Fresh V60 bloom is 45 s.
- [ ] Encore-style stepped grinders produce “2 steps”. Stepless grinders do not.
- [ ] A sour fast espresso suggests grind before yield. A balanced cup suggests no change.
- [ ] Elapsed time equals `now - anchor` after a gap with no ticks.
- [ ] Best brew for a bean prefers the score closest to balanced, then the newer log.

### Task 3: Storage and backup

**Files:** `src/dial/store.ts`, `src/dial/backup.ts`, `src/dial/backup.test.ts`. Wire Journal export/import to version 3.

- [ ] Version 2 import returns journal and leaves dial null.
- [ ] Version 3 round-trips overrides, beans, and brews.

### Task 4: Dial UI

**Files:** `src/dial/Dial.tsx`, `src/App.tsx`, `src/index.css`, `public/sw.js` cache name `crema-shell-v4`.

- [ ] Tabs: Brew, Dial, Journal.
- [ ] Kit picker, spec sheet with fill-in for nulls, bean form, V60 timer, taste suggestion, history.
- [ ] Test ids for the smoke shots.

### Task 5: Checks and artifacts

- [ ] `npx vitest run` and `npm run build`.
- [ ] `node scripts/dial-shots.mjs` at 390 px, and confirm no horizontal overflow at 375, 390, and 402.
- [ ] Refresh `crema-dist.zip`, `crema-source.zip`, and screenshots under `/opt/cursor/artifacts`.
- [ ] Add a LEARNING.md section. Push the branch and update PR 1 without merging.

## Spec coverage

| Requirement | Task |
|---|---|
| Sourced catalog, nulls allowed | 1 |
| User override layer and labels | 1, 4 |
| Beans and starting recipe | 2, 4 |
| Four methods and timestamp timer | 2, 4 |
| One offline suggestion | 2, 4 |
| History, best bag, backup | 2, 3 |
| PWA shell and phone widths | 4, 5 |
