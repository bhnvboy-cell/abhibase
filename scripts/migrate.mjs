import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Client } from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const schema = readFileSync(join(__dirname, '..', 'database.sql'), 'utf8')

const db = new Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: '40589999',
  database: 'abhibase',
})

await db.connect()

try {
  await db.query(schema)
  const tables = await db.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`
  )
  console.log('Schema applied. Tables:')
  for (const r of tables.rows) console.log('  - ' + r.table_name)
  console.log('OK')
} catch (err) {
  console.error('Schema error:', err.message)
  process.exitCode = 1
} finally {
  await db.end()
}
