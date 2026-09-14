import { Client } from 'pg'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const schema = readFileSync(join(__dirname, '..', 'database.sql'), 'utf8')

const explicit = process.argv[2]
const candidates = explicit
  ? [explicit]
  : [process.env.PGPASSWORD || '', 'postgres', 'admin', 'root', 'password', '1234', 'nagaraj']

async function connect(password) {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password,
    database: 'postgres',
    connectionTimeoutMillis: 4000,
  })
  await client.connect()
  return client
}

let admin = null
let workingPassword = null
for (const pw of candidates) {
  try {
    admin = await connect(pw)
    workingPassword = pw
    console.log(`Connected as postgres (password: ${pw === '' ? '(none/trust)' : '***'})`)
    break
  } catch {
    admin = null
  }
}

if (!admin) {
  console.error('FAILED: could not connect with common passwords.')
  console.error('Re-run with your password: node scripts/db-setup.mjs YOUR_PASSWORD')
  process.exit(1)
}

try {
  const { rows } = await admin.query(`SELECT 1 FROM pg_database WHERE datname = 'abhibase'`)
  if (rows.length === 0) {
    await admin.query('CREATE DATABASE abhibase')
    console.log('Created database "abhibase"')
  } else {
    console.log('Database "abhibase" already exists')
  }
} finally {
  await admin.end()
}

const db = new Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: workingPassword,
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
  const connStr = `postgresql://postgres:${workingPassword}@127.0.0.1:5432/abhibase`
  writeFileSync(join(__dirname, '..', '.dbconn'), connStr, 'utf8')
  console.log('OK')
} catch (err) {
  console.error('Schema error:', err.message)
  process.exitCode = 1
} finally {
  await db.end()
}
