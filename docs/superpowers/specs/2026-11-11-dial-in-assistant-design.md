# Dial-in assistant

Status: approved, including the later note that blank catalog specs are fillable on the user’s own kit. This is a real-brew tool beside the existing simulated Brew screen. No accounts, no server, no AI coach, no shared map.

## What it is

A UK barista on an iPhone Home Screen can pick the machine and grinder they actually own, log the beans in the bag, get a starting recipe for the method, run a guided timer, then rate the cup and receive one offline suggestion.

The simulated Brew tab stays as it is. Dial-in is a third tab, **Dial**, with no Simulated pill.

## Kit

A setup has a name (Home, Work, up to 40 characters), one machine, and one grinder. Several setups can be saved. One is active.

The catalog is typed data in `src/dial/catalog.ts`. Each machine and grinder has a source URL. A field is `null` when that page does not state it. The app must not invent a number to fill a gap.

Machine fields: brand, model, category (`home` | `prosumer` | `commercial`), heating (`single-boiler` | `heat-exchanger` | `dual-boiler` | `thermocoil` | `thermoblock` | null), PID (boolean or null), brew pressure in bar, pump pressure in bar, portafilter millimetres, pre-infusion (short text or null), flow control (boolean or null).

Grinder fields: brand, model, category, burr type (`conical` | `flat` | null), burr size in millimetres, adjustment (`stepped` | `stepless` | null), step count, espresso range text, filter range text, whether the maker says it suits espresso and filter (boolean or null).

### Overrides

The catalog record is never written. A saved override sits on top, keyed by catalog id, in IndexedDB.

- A field that already has a sourced value stays sourced. An override for that field is rejected.
- A field that is null can be filled. The screen labels it **added by you**. Sourced values are labelled **sourced**.
- Clearing an override returns the field to unknown.
- The same validators as custom kit apply: lengths, numeric ranges, and units.

Custom machines and grinders are not catalog rows. Every value on them is **added by you**.

Ranges: names 1–60 characters, notes up to 500, brew and pump pressure 1–20 bar, portafilter 49–60 mm, burr size 30–120 mm, steps 2–400, pre-infusion text up to 80 characters.

## Beans

Name, roaster, origin (country, region, or blend), process (`washed` | `natural` | `honey` | `anaerobic` | `other`), roast (`light` | `medium-light` | `medium` | `medium-dark` | `dark`), roast date, optional notes.

Days off roast are the whole days between the roast date and today, never negative.

## Starting recipe

Pure function of method, roast, days off roast, and the grinder record (after overrides).

Roast groups: light and medium-light are the light group; medium-dark and dark are the dark group.

- Lighter group: finer grind wording, longer ratio, hotter water.
- Darker group: coarser wording, shorter ratio, cooler water.
- Under 8 days off roast, pour-over and AeroPress get a longer bloom. Espresso and cold brew do not invent a bloom.

Grind wording uses a published range when the catalog or the user’s addition has one (`1–20` on the Encore ESP). It never invents a click number the maker did not publish. If the maker says the grinder is not for espresso, the espresso recipe says so.

Methods:

| Method | Medium baseline |
|---|---|
| Espresso | 18 g in, 36 g out, 93°C, aim about 28 s |
| V60 | 15 g, 250 g water, 93°C, 30 s bloom with 30 g |
| AeroPress | 15 g, 200 g water, 90°C, 90 s steep, 30 s press |
| Cold brew | 80 g, 800 g water, 16 h, coarse |

Light espresso moves to 45 g out and 96°C. Dark espresso moves to 32 g out and 90°C. V60 light uses 270 g at 96°C; dark uses 225 g at 90°C. Fresh V60 bloom is 45 s. Fresh AeroPress adds a 20 s bloom. Light cold brew is 18 h; dark is 14 h.

## Timer

Stages come from the recipe. Espresso is one open shot timer plus a yield the user types at the end. V60 has bloom, two pours with target weights, then drawdown. AeroPress has bloom (if any), steep, and press. Cold brew is one long steep.

Elapsed time is `offset + (now - anchor)` from timestamps. The interval only refreshes the display. Pausing stores the elapsed offset. Coming back from a dimmed screen or a backgrounded tab recomputes from the anchor. It does not add ticks that were missed.

Cold brew copy tells the user that iOS may suspend the page, and that reopening Crema shows the time from the start timestamp. There is no push notification.

## Taste and one suggestion

After the brew, two scales of 1–5: sour to bitter, and weak to strong. Optional notes.

`suggest()` in `src/dial/rules.ts` returns exactly one change, or a keeper sentence when both scales are 3. No network.

Espresso, first match wins:

1. Sour (1–2) and shot under 25 s: grind finer. Stepped grinders say “2 steps”. Stepless says “a small turn”. Unknown adjustment says “finer” without a step count.
2. Sour and the shot was not fast: raise yield by 4 g, capped at 55 g.
3. Bitter (4–5) and shot over 35 s: grind coarser, same wording rules.
4. Bitter otherwise: drop temperature 2°C, not below 86°C.
5. Weak (1–2): raise dose by 0.5 g, capped at 22 g.
6. Strong (4–5): lower dose by 0.5 g, not below 14 g.

Sour is checked before weak, so a sour and weak shot gets one extraction change, not both.

V60: sour → grind finer; bitter → temperature down 2°C (not below 85); weak → 1 g more coffee; strong → 20 g more water.

AeroPress: sour → 15 s more steep; bitter → temperature down 2°C (not below 80); weak → 1 g more coffee; strong → 20 g more water.

Cold brew: sour → 2 h longer (cap 24 h); bitter → 2 h shorter (floor 8 h); weak → 10 g more coffee; strong → dilute the finished brew with 100 g water.

Each rule has an id and a one-sentence reason stored with the brew.

## History and backup

Every saved brew stores the bean id, setup id, recipe, stage times, yield if any, taste, and suggestion. “Your best for this bag” is the brew whose taste is closest to 3 and 3. Ties go to the newer brew.

Dial state lives in IndexedDB (`crema` / `kv` / `dial`), separate from the catalog. Export from the journal backup writes version 3: the journal plus dial. A version 1 or 2 file still imports as a journal and does not delete dial data. A version 3 file replaces both after the same confirm. Invalid files change nothing.

## Phone

375, 390, and 402 px. Targets at least 44 px. The tab bar is Brew, Dial, Journal. Timers use `tabular-nums`. Reduced motion does not stop the clock.

## Out of scope

Community recipes, accounts, a server, an AI coach, and a learning library.
