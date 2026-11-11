# Moving this schema to Postgres later

Do not build that server in this phase. The tables are shaped so a later community phase can load the same rows into Supabase (Postgres).

What already matches:

- Text primary keys, not SQLite `rowid`.
- Dates and instants stored as ISO text. In Postgres these can stay `text` or become `date` / `timestamptz` in one migration.
- Booleans are `integer` 0/1 with `CHECK (col IN (0, 1))`. Map them to `boolean` when the table is created in Postgres.
- Foreign keys, `CHECK` ranges, and indexes are ordinary SQL.
- Catalog seed files are `INSERT ... ON CONFLICT (id) DO NOTHING`, which Postgres accepts.

What has to be rewritten, not copied:

- `PRAGMA foreign_keys` is SQLite. Postgres enforces foreign keys without it.
- The two `BEFORE INSERT` triggers use `RAISE(ABORT, ...)`. Postgres uses `CREATE FUNCTION ... RAISE EXCEPTION` plus `CREATE TRIGGER ... EXECUTE FUNCTION`. The app also refuses to override a sourced field, so a missed trigger does not silently change the catalog.
- The browser file is either OPFS or an IndexedDB snapshot of one SQLite file. A Supabase phase would copy rows out of this file; it would not attach the file as a Postgres database.

The journal (photos and map pins) is still a JSON document in IndexedDB. Only the equipment catalog and dial-in rows are in this schema.
