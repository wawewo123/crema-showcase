-- Crema dial-in schema, version 1.
-- Portable toward Postgres: TEXT ids, ISO timestamps, INTEGER 0/1 for booleans,
-- no SQLite-only column types. The override triggers below use SQLite RAISE
-- syntax; see db/POSTGRES.md before a Supabase move.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS machines (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL CHECK (length(brand) BETWEEN 1 AND 60),
  model TEXT NOT NULL CHECK (length(model) BETWEEN 1 AND 60),
  category TEXT NOT NULL CHECK (category IN ('home', 'prosumer', 'commercial')),
  heating TEXT CHECK (heating IS NULL OR heating IN ('single-boiler', 'heat-exchanger', 'dual-boiler', 'thermocoil', 'thermoblock')),
  pid INTEGER CHECK (pid IS NULL OR pid IN (0, 1)),
  brew_bar REAL CHECK (brew_bar IS NULL OR (brew_bar >= 1 AND brew_bar <= 20)),
  pump_bar REAL CHECK (pump_bar IS NULL OR (pump_bar >= 1 AND pump_bar <= 20)),
  portafilter_mm INTEGER CHECK (portafilter_mm IS NULL OR portafilter_mm BETWEEN 49 AND 60),
  pre_infusion TEXT CHECK (pre_infusion IS NULL OR length(pre_infusion) <= 80),
  flow_control INTEGER CHECK (flow_control IS NULL OR flow_control IN (0, 1)),
  source_url TEXT NOT NULL CHECK (substr(source_url, 1, 8) = 'https://'),
  source_title TEXT NOT NULL CHECK (length(source_title) BETWEEN 1 AND 160)
);

CREATE INDEX IF NOT EXISTS machines_brand ON machines (brand);

CREATE TABLE IF NOT EXISTS grinders (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL CHECK (length(brand) BETWEEN 1 AND 60),
  model TEXT NOT NULL CHECK (length(model) BETWEEN 1 AND 60),
  category TEXT NOT NULL CHECK (category IN ('home', 'prosumer', 'commercial')),
  burr_type TEXT CHECK (burr_type IS NULL OR burr_type IN ('conical', 'flat')),
  burr_size_mm REAL CHECK (burr_size_mm IS NULL OR (burr_size_mm >= 30 AND burr_size_mm <= 120)),
  adjustment TEXT CHECK (adjustment IS NULL OR adjustment IN ('stepped', 'stepless')),
  steps INTEGER CHECK (steps IS NULL OR steps BETWEEN 2 AND 400),
  espresso_range TEXT CHECK (espresso_range IS NULL OR length(espresso_range) <= 80),
  filter_range TEXT CHECK (filter_range IS NULL OR length(filter_range) <= 80),
  espresso_suitable INTEGER CHECK (espresso_suitable IS NULL OR espresso_suitable IN (0, 1)),
  filter_suitable INTEGER CHECK (filter_suitable IS NULL OR filter_suitable IN (0, 1)),
  source_url TEXT NOT NULL CHECK (substr(source_url, 1, 8) = 'https://'),
  source_title TEXT NOT NULL CHECK (length(source_title) BETWEEN 1 AND 160),
  CHECK (adjustment IS NULL OR adjustment <> 'stepless' OR steps IS NULL)
);

CREATE INDEX IF NOT EXISTS grinders_brand ON grinders (brand);

CREATE TABLE IF NOT EXISTS setups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 40),
  active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0, 1)),
  machine_id TEXT REFERENCES machines (id),
  grinder_id TEXT REFERENCES grinders (id),
  custom_machine_brand TEXT CHECK (custom_machine_brand IS NULL OR length(custom_machine_brand) BETWEEN 1 AND 60),
  custom_machine_model TEXT CHECK (custom_machine_model IS NULL OR length(custom_machine_model) BETWEEN 1 AND 60),
  custom_machine_heating TEXT,
  custom_machine_pid INTEGER CHECK (custom_machine_pid IS NULL OR custom_machine_pid IN (0, 1)),
  custom_machine_brew_bar REAL CHECK (custom_machine_brew_bar IS NULL OR (custom_machine_brew_bar >= 1 AND custom_machine_brew_bar <= 20)),
  custom_machine_pump_bar REAL CHECK (custom_machine_pump_bar IS NULL OR (custom_machine_pump_bar >= 1 AND custom_machine_pump_bar <= 20)),
  custom_machine_portafilter_mm INTEGER CHECK (custom_machine_portafilter_mm IS NULL OR custom_machine_portafilter_mm BETWEEN 49 AND 60),
  custom_machine_pre_infusion TEXT CHECK (custom_machine_pre_infusion IS NULL OR length(custom_machine_pre_infusion) <= 80),
  custom_machine_flow_control INTEGER CHECK (custom_machine_flow_control IS NULL OR custom_machine_flow_control IN (0, 1)),
  custom_grinder_brand TEXT CHECK (custom_grinder_brand IS NULL OR length(custom_grinder_brand) BETWEEN 1 AND 60),
  custom_grinder_model TEXT CHECK (custom_grinder_model IS NULL OR length(custom_grinder_model) BETWEEN 1 AND 60),
  custom_grinder_burr_type TEXT CHECK (custom_grinder_burr_type IS NULL OR custom_grinder_burr_type IN ('conical', 'flat')),
  custom_grinder_burr_mm REAL CHECK (custom_grinder_burr_mm IS NULL OR (custom_grinder_burr_mm >= 30 AND custom_grinder_burr_mm <= 120)),
  custom_grinder_adjustment TEXT CHECK (custom_grinder_adjustment IS NULL OR custom_grinder_adjustment IN ('stepped', 'stepless')),
  custom_grinder_steps INTEGER CHECK (custom_grinder_steps IS NULL OR custom_grinder_steps BETWEEN 2 AND 400),
  custom_grinder_espresso_range TEXT CHECK (custom_grinder_espresso_range IS NULL OR length(custom_grinder_espresso_range) <= 80),
  custom_grinder_filter_range TEXT CHECK (custom_grinder_filter_range IS NULL OR length(custom_grinder_filter_range) <= 80),
  CHECK (NOT (machine_id IS NOT NULL AND custom_machine_brand IS NOT NULL)),
  CHECK (NOT (grinder_id IS NOT NULL AND custom_grinder_brand IS NOT NULL)),
  CHECK (custom_grinder_adjustment IS NULL OR custom_grinder_adjustment <> 'stepless' OR custom_grinder_steps IS NULL)
);

CREATE TABLE IF NOT EXISTS beans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  roaster TEXT NOT NULL CHECK (length(roaster) BETWEEN 1 AND 60),
  origin TEXT NOT NULL CHECK (length(origin) BETWEEN 1 AND 60),
  process TEXT NOT NULL CHECK (process IN ('washed', 'natural', 'honey', 'anaerobic', 'other')),
  roast TEXT NOT NULL CHECK (roast IN ('light', 'medium-light', 'medium', 'medium-dark', 'dark')),
  roast_date TEXT NOT NULL CHECK (length(roast_date) = 10 AND substr(roast_date, 5, 1) = '-' AND substr(roast_date, 8, 1) = '-'),
  notes TEXT NOT NULL DEFAULT '' CHECK (length(notes) <= 500)
);

CREATE INDEX IF NOT EXISTS beans_roast_date ON beans (roast_date);

CREATE TABLE IF NOT EXISTS brews (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('espresso', 'v60', 'aeropress', 'cold-brew')),
  bean_id TEXT NOT NULL REFERENCES beans (id),
  setup_id TEXT NOT NULL REFERENCES setups (id),
  dose_g REAL NOT NULL CHECK (dose_g > 0 AND dose_g <= 200),
  water_g REAL NOT NULL CHECK (water_g > 0 AND water_g <= 5000),
  yield_g REAL NOT NULL CHECK (yield_g > 0 AND yield_g <= 5000),
  temp_c REAL NOT NULL CHECK (temp_c >= 0 AND temp_c <= 100),
  grind TEXT NOT NULL CHECK (length(grind) BETWEEN 1 AND 300),
  fresh INTEGER NOT NULL CHECK (fresh IN (0, 1)),
  stages_json TEXT NOT NULL,
  elapsed_ms INTEGER NOT NULL CHECK (elapsed_ms >= 0),
  actual_yield_g REAL CHECK (actual_yield_g IS NULL OR (actual_yield_g > 0 AND actual_yield_g <= 5000)),
  sour_bitter INTEGER CHECK (sour_bitter IS NULL OR sour_bitter BETWEEN 1 AND 5),
  weak_strong INTEGER CHECK (weak_strong IS NULL OR weak_strong BETWEEN 1 AND 5),
  taste_notes TEXT CHECK (taste_notes IS NULL OR length(taste_notes) <= 500),
  suggestion TEXT
);

CREATE INDEX IF NOT EXISTS brews_bean_at ON brews (bean_id, at);

CREATE TABLE IF NOT EXISTS machine_overrides (
  machine_id TEXT NOT NULL REFERENCES machines (id),
  field TEXT NOT NULL CHECK (field IN ('heating', 'pid', 'brew_bar', 'pump_bar', 'portafilter_mm', 'pre_infusion', 'flow_control')),
  value_text TEXT NOT NULL,
  PRIMARY KEY (machine_id, field),
  CHECK (
    (field = 'pid' AND value_text IN ('0', '1'))
    OR (field = 'flow_control' AND value_text IN ('0', '1'))
    OR (field = 'heating' AND value_text IN ('single-boiler', 'heat-exchanger', 'dual-boiler', 'thermocoil', 'thermoblock'))
    OR (field IN ('brew_bar', 'pump_bar') AND CAST(value_text AS REAL) >= 1 AND CAST(value_text AS REAL) <= 20)
    OR (field = 'portafilter_mm' AND CAST(value_text AS INTEGER) BETWEEN 49 AND 60)
    OR (field = 'pre_infusion' AND length(value_text) BETWEEN 1 AND 80)
  )
);

CREATE TABLE IF NOT EXISTS grinder_overrides (
  grinder_id TEXT NOT NULL REFERENCES grinders (id),
  field TEXT NOT NULL CHECK (field IN ('burr_type', 'burr_size_mm', 'adjustment', 'steps', 'espresso_range', 'filter_range', 'espresso_suitable', 'filter_suitable')),
  value_text TEXT NOT NULL,
  PRIMARY KEY (grinder_id, field),
  CHECK (
    (field = 'burr_type' AND value_text IN ('conical', 'flat'))
    OR (field = 'adjustment' AND value_text IN ('stepped', 'stepless'))
    OR (field IN ('espresso_suitable', 'filter_suitable') AND value_text IN ('0', '1'))
    OR (field = 'burr_size_mm' AND CAST(value_text AS REAL) >= 30 AND CAST(value_text AS REAL) <= 120)
    OR (field = 'steps' AND CAST(value_text AS INTEGER) BETWEEN 2 AND 400)
    OR (field IN ('espresso_range', 'filter_range') AND length(value_text) BETWEEN 1 AND 80)
  )
);

CREATE TRIGGER IF NOT EXISTS machine_override_only_blank
BEFORE INSERT ON machine_overrides
FOR EACH ROW
BEGIN
  SELECT RAISE(ABORT, 'cannot override a sourced field')
  WHERE EXISTS (
    SELECT 1 FROM machines AS m
    WHERE m.id = NEW.machine_id
      AND (
        (NEW.field = 'heating' AND m.heating IS NOT NULL)
        OR (NEW.field = 'pid' AND m.pid IS NOT NULL)
        OR (NEW.field = 'brew_bar' AND m.brew_bar IS NOT NULL)
        OR (NEW.field = 'pump_bar' AND m.pump_bar IS NOT NULL)
        OR (NEW.field = 'portafilter_mm' AND m.portafilter_mm IS NOT NULL)
        OR (NEW.field = 'pre_infusion' AND m.pre_infusion IS NOT NULL)
        OR (NEW.field = 'flow_control' AND m.flow_control IS NOT NULL)
      )
  );
END;

CREATE TRIGGER IF NOT EXISTS grinder_override_only_blank
BEFORE INSERT ON grinder_overrides
FOR EACH ROW
BEGIN
  SELECT RAISE(ABORT, 'cannot override a sourced field')
  WHERE EXISTS (
    SELECT 1 FROM grinders AS g
    WHERE g.id = NEW.grinder_id
      AND (
        (NEW.field = 'burr_type' AND g.burr_type IS NOT NULL)
        OR (NEW.field = 'burr_size_mm' AND g.burr_size_mm IS NOT NULL)
        OR (NEW.field = 'adjustment' AND g.adjustment IS NOT NULL)
        OR (NEW.field = 'steps' AND g.steps IS NOT NULL)
        OR (NEW.field = 'espresso_range' AND g.espresso_range IS NOT NULL)
        OR (NEW.field = 'filter_range' AND g.filter_range IS NOT NULL)
        OR (NEW.field = 'espresso_suitable' AND g.espresso_suitable IS NOT NULL)
        OR (NEW.field = 'filter_suitable' AND g.filter_suitable IS NOT NULL)
      )
  );
END;

INSERT INTO schema_migrations (version, name, applied_at)
SELECT 1, 'initial', '2026-11-11T00:00:00.000Z'
WHERE NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 1);
