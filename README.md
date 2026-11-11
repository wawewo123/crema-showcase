# Crema

A mobile-first espresso workflow toy and a private café journal. Brew numbers, the cup, and the shot curve are a simulation of the interface. They do not predict extraction. Sample cafés are fictional. Your own visits stay on this device.

The previous single-file showcase is preserved, unchanged, at `legacy/original-showcase.html`.

## Open the built file

```bash
npm install
npm run build
```

Open `dist/index.html` in a browser. It is one self-contained file. From `file://` the app works; the service worker does not register there. Map tiles need the internet. Pins, the visit list, and Brew work without it.

```bash
npm run preview   # serves dist/ on localhost, where the offline shell can install
npm run dev       # live reload while editing
```

## Checks

```bash
npm test          # maths, journal migration, backup validation, controls
npm run build     # typecheck and the single-file bundle
node scripts/smoke.mjs
```

The smoke script drives system Chrome at iPhone-sized viewports. That is emulation, not a physical iPhone.

## Journal storage

Visits are saved in IndexedDB in this browser, with a metadata mirror in `localStorage` under `crema.journal`. A home-screen icon does not share that storage with a browser tab. Export a backup from **All visits** before clearing data or switching browsers. There is no account.

See `LEARNING.md` for why the screen looks like this and how to ask for the next change.
