import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

const root = new URL('../', import.meta.url)
const schema = readFileSync(new URL('db/schema.sql', root), 'utf8')
const machines = readFileSync(new URL('db/seed/machines.sql', root), 'utf8')
const grinders = readFileSync(new URL('db/seed/grinders.sql', root), 'utf8')

const db = new DatabaseSync(':memory:')
db.exec('PRAGMA foreign_keys = ON;')
db.exec(schema)
db.exec(machines)
db.exec(grinders)

const machineCount = db.prepare('SELECT COUNT(*) AS n FROM machines').get().n
const grinderCount = db.prepare('SELECT COUNT(*) AS n FROM grinders').get().n
const missing = db.prepare("SELECT id FROM machines WHERE source_url IS NULL OR source_url NOT LIKE 'https://%' UNION ALL SELECT id FROM grinders WHERE source_url IS NULL OR source_url NOT LIKE 'https://%'").all()
if (missing.length) {
  console.error('Seed rows missing an https source:', missing)
  process.exit(1)
}
if (machineCount < 1 || grinderCount < 1) {
  console.error('Seed produced no catalog rows')
  process.exit(1)
}

let rejected = false
try {
  db.prepare("UPDATE machines SET brew_bar = 99 WHERE id = 'gaggia-classic-pro-e24'").run()
} catch {
  rejected = true
}
if (!rejected) {
  console.error('CHECK constraint did not reject brew_bar 99')
  process.exit(1)
}

const niche = db.prepare("SELECT espresso_range FROM grinders WHERE id = 'niche-zero'").get()
if (niche.espresso_range != null) {
  console.error('Niche Zero espresso range must stay null until a source states it')
  process.exit(1)
}

console.log(`seed ok: ${machineCount} machines, ${grinderCount} grinders`)
db.close()
