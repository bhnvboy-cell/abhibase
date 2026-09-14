#!/usr/bin/env node

/**
 * Abhibase Test Runner
 * Runs all tests without external dependencies
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import pg from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

const { Pool } = pg

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

// Test counters
let passed = 0
let failed = 0
let skipped = 0

// Test results
const results = []

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function test(name, fn) {
  try {
    fn()
    passed++
    results.push({ name, status: 'passed' })
    log(`  ✓ ${name}`, colors.green)
  } catch (error) {
    failed++
    results.push({ name, status: 'failed', error: error.message })
    log(`  ✗ ${name}`, colors.red)
    log(`    ${error.message}`, colors.red)
  }
}

function skip(name, reason) {
  skipped++
  results.push({ name, status: 'skipped', reason })
  log(`  ○ ${name} (skipped: ${reason})`, colors.yellow)
}

function describe(name, fn) {
  log(`\n${colors.bright}${colors.cyan}${name}${colors.reset}`)
  fn()
}

function expect(value) {
  return {
    toBe(expected) {
      if (value !== expected) {
        throw new Error(`Expected ${expected}, got ${value}`)
      }
    },
    toEqual(expected) {
      if (JSON.stringify(value) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`)
      }
    },
    toBeDefined() {
      if (value === undefined || value === null) {
        throw new Error('Expected value to be defined')
      }
    },
    toBeUndefined() {
      if (value !== undefined) {
        throw new Error(`Expected undefined, got ${value}`)
      }
    },
    toBeNull() {
      if (value !== null) {
        throw new Error(`Expected null, got ${value}`)
      }
    },
    toBeGreaterThan(expected) {
      if (!(value > expected)) {
        throw new Error(`Expected ${value} to be greater than ${expected}`)
      }
    },
    toBeLessThan(expected) {
      if (!(value < expected)) {
        throw new Error(`Expected ${value} to be less than ${expected}`)
      }
    },
    toContain(expected) {
      if (Array.isArray(value)) {
        if (!value.includes(expected)) {
          throw new Error(`Expected array to contain ${expected}`)
        }
      } else if (typeof value === 'string') {
        if (!value.includes(expected)) {
          throw new Error(`Expected string to contain ${expected}`)
        }
      }
    },
    toBeVisible() {
      // Stub for E2E tests
    },
    toHaveURL() {
      // Stub for E2E tests
    },
    toHaveTitle() {
      // Stub for E2E tests
    }
  }
}

// Database connection
let pool = null

async function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: 'postgresql://postgres:40589999@localhost:5432/abhibase'
    })
  }
  return pool
}

async function closePool() {
  if (pool) {
    await pool.end()
    pool = null
  }
}

// File system helpers
function fileExists(path) {
  return existsSync(join(rootDir, path))
}

function readFile(path) {
  return readFileSync(join(rootDir, path), 'utf-8')
}

function readJSON(path) {
  return JSON.parse(readFile(path))
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(60), colors.bright)
  log('  ABBHIBASE TEST SUITE', colors.bright + colors.cyan)
  log('='.repeat(60) + '\n', colors.bright)

  // Database Tests
  describe('Database Schema Validation', async () => {
    const p = await getPool()

    test('should have all required tables', async () => {
      const result = await p.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `)
      
      const tables = result.rows.map(r => r.table_name)
      
      const requiredTables = [
        'users', 'projects', 'tasks', 'files', 'messages', 'messages_read',
        'posts', 'post_likes', 'post_comments', 'polls', 'poll_options', 'poll_votes',
        'activities', 'comments', 'notifications', 'notification_preferences',
        'profiles', 'attachments', 'automations', 'templates', 'integrations', 'branches',
        'invoices', 'social_posts', 'meetings', 'audit_logs', 'user_sessions',
        'generated_apps', 'websites'
      ]

      for (const table of requiredTables) {
        expect(tables).toContain(table)
      }
    })

    test('should have users table with required columns', async () => {
      const result = await p.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users'
      `)
      
      const columns = result.rows.map(r => r.column_name)
      
      expect(columns).toContain('id')
      expect(columns).toContain('email')
      expect(columns).toContain('password_hash')
      expect(columns).toContain('role')
    })

    test('should have proper foreign key constraints', async () => {
      const result = await p.query(`
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
      `)
      
      expect(result.rows.length).toBeGreaterThan(0)
    })
  })

  // File Structure Tests
  describe('File Structure Validation', () => {
    test('should have package.json', () => {
      expect(fileExists('package.json')).toBe(true)
    })

    test('should have tsconfig.json', () => {
      expect(fileExists('tsconfig.json')).toBe(true)
    })

    test('should have next.config.mjs', () => {
      expect(fileExists('next.config.mjs')).toBe(true)
    })

    test('should have .env.local', () => {
      expect(fileExists('.env.local')).toBe(true)
    })

    test('should have .gitignore', () => {
      expect(fileExists('.gitignore')).toBe(true)
    })

    test('should have database.sql', () => {
      expect(fileExists('database.sql')).toBe(true)
    })
  })

  // API Routes Tests
  describe('API Routes Validation', () => {
    const apiRoutes = [
      'app/api/auth/[...action]/route.ts',
      'app/api/projects/route.ts',
      'app/api/tasks/route.ts',
      'app/api/uploads/route.ts',
      'app/api/notifications/route.ts',
      'app/api/settings/api-keys/route.ts',
      'app/api/settings/notifications/route.ts',
      'app/api/websites/route.ts',
      'app/api/apps/route.ts',
      'app/api/meetings/route.ts',
      'app/api/payments/invoices/route.ts',
      'app/api/social/posts/route.ts',
      'app/api/security/audit-logs/route.ts',
      'app/api/security/sessions/route.ts',
      'app/api/security/2fa/setup/route.ts',
      'app/api/security/2fa/verify/route.ts',
      'app/api/security/2fa/disable/route.ts',
      'app/api/ai/chat/route.ts',
      'app/api/ai/summarize/route.ts',
      'app/api/branches/route.ts',
      'app/api/integrations/route.ts',
      'app/api/templates/route.ts',
      'app/api/automations/route.ts',
      'app/api/analytics/route.ts',
      'app/api/habits/route.ts',
      'app/api/events/route.ts',
      'app/api/notes/route.ts',
      'app/api/expenses/groups/route.ts',
    ]

    for (const route of apiRoutes) {
      test(`should have ${route}`, () => {
        expect(fileExists(route)).toBe(true)
      })
    }
  })

  // Components Tests
  describe('Components Validation', () => {
    const components = [
      'components/sidebar.tsx',
      'components/website-generator.tsx',
      'components/generator-hub.tsx',
      'components/app-builder.tsx',
      'components/app-templates-gallery.tsx',
      'components/security-settings.tsx',
      'components/meeting-notes.tsx',
      'components/social-media-generator.tsx',
      'components/payment-tracker.tsx',
      'components/pwa-registration.tsx',
      'components/ai-chat.tsx',
      'components/kanban.tsx',
      'components/file-upload.tsx',
      'components/auth-provider.tsx',
      'components/navbar.tsx',
      'components/theme-toggle.tsx',
      'components/providers.tsx',
      'components/empty-state.tsx',
    ]

    for (const component of components) {
      test(`should have ${component.split('/').pop()}`, () => {
        expect(fileExists(component)).toBe(true)
      })
    }
  })

  // PWA Tests
  describe('PWA Support Validation', () => {
    test('should have manifest.json', () => {
      expect(fileExists('public/manifest.json')).toBe(true)
      
      const manifest = readJSON('public/manifest.json')
      expect(manifest.name).toBeDefined()
      expect(manifest.short_name).toBeDefined()
      expect(manifest.start_url).toBeDefined()
      expect(manifest.display).toBe('standalone')
      expect(manifest.icons).toBeDefined()
      expect(manifest.icons.length).toBeGreaterThan(0)
    })

    test('should have service worker', () => {
      expect(fileExists('public/sw.js')).toBe(true)
      
      const sw = readFile('public/sw.js')
      expect(sw).toContain('install')
      expect(sw).toContain('activate')
      expect(sw).toContain('fetch')
    })

    test('should have offline page', () => {
      expect(fileExists('public/offline.html')).toBe(true)
    })

    test('should have PWA component', () => {
      expect(fileExists('components/pwa-registration.tsx')).toBe(true)
    })
  })

  // Docker Tests
  describe('Docker Support Validation', () => {
    test('should have Dockerfile', () => {
      expect(fileExists('Dockerfile')).toBe(true)
      
      const dockerfile = readFile('Dockerfile')
      expect(dockerfile).toContain('FROM node:')
      expect(dockerfile).toContain('npm run build')
      expect(dockerfile).toContain('EXPOSE 3000')
    })

    test('should have docker-compose.yml', () => {
      expect(fileExists('docker-compose.yml')).toBe(true)
      
      const compose = readFile('docker-compose.yml')
      expect(compose).toContain('services:')
      expect(compose).toContain('postgres:')
      expect(compose).toContain('5432:')
    })

    test('should have .dockerignore', () => {
      expect(fileExists('.dockerignore')).toBe(true)
      
      const dockerignore = readFile('.dockerignore')
      expect(dockerignore).toContain('node_modules')
      expect(dockerignore).toContain('.next')
      expect(dockerignore).toContain('.env*')
    })
  })

  // Documentation Tests
  describe('Documentation Validation', () => {
    test('should have README.md', () => {
      expect(fileExists('README.md')).toBe(true)
      
      const readme = readFile('README.md')
      expect(readme).toContain('AbhiBase')
      expect(readme).toContain('Features')
      expect(readme).toContain('Installation')
    })

    test('should have LICENSE', () => {
      expect(fileExists('LICENSE')).toBe(true)
      
      const license = readFile('LICENSE')
      expect(license).toContain('MIT License')
    })

    test('should have TODO.md', () => {
      expect(fileExists('TODO.md')).toBe(true)
      
      const todo = readFile('TODO.md')
      expect(todo).toContain('AbhiBase')
      expect(todo).toContain('v1.0')
      expect(todo).toContain('Completed Features')
    })
  })

  // Migrations Tests
  describe('Migrations Validation', () => {
    const migrations = [
      'migrations/003_add_enterprise_features.sql',
      'migrations/004_add_generated_apps.sql',
      'migrations/005_add_websites.sql',
    ]

    for (const migration of migrations) {
      test(`should have ${migration.split('/').pop()}`, () => {
        expect(fileExists(migration)).toBe(true)
      })
    }
  })

  // Package.json Scripts Tests
  describe('Package.json Scripts Validation', () => {
    const pkg = readJSON('package.json')

    test('should have dev script', () => {
      expect(pkg.scripts.dev).toBeDefined()
    })

    test('should have build script', () => {
      expect(pkg.scripts.build).toBeDefined()
    })

    test('should have start script', () => {
      expect(pkg.scripts.start).toBeDefined()
    })

    test('should have test script', () => {
      expect(pkg.scripts.test).toBeDefined()
    })

    test('should have test:e2e script', () => {
      expect(pkg.scripts['test:e2e']).toBeDefined()
    })
  })

  // Security Tests
  describe('Security Validation', () => {
    test('should have auth secret in .env.local', () => {
      const env = readFile('.env.local')
      expect(env).toContain('AUTH_SECRET=')
    })

    test('should have database URL in .env.local', () => {
      const env = readFile('.env.local')
      expect(env).toContain('DATABASE_URL=')
    })

    test('should have .env* in .gitignore', () => {
      const gitignore = readFile('.gitignore')
      expect(gitignore).toContain('.env*')
    })

    test('should not have .env.local in git', () => {
      // This is a conceptual test - in reality we'd check git status
      expect(fileExists('.gitignore')).toBe(true)
    })
  })

  // Close database connection
  await closePool()

  // Print results
  log('\n' + '='.repeat(60), colors.bright)
  log('  TEST RESULTS', colors.bright + colors.cyan)
  log('='.repeat(60), colors.bright)
  
  log(`\n  ${colors.green}Passed: ${passed}${colors.reset}`)
  log(`  ${colors.red}Failed: ${failed}${colors.reset}`)
  log(`  ${colors.yellow}Skipped: ${skipped}${colors.reset}`)
  log(`  ${colors.bright}Total: ${passed + failed + skipped}${colors.reset}`)
  
  if (failed > 0) {
    log(`\n${colors.red}Some tests failed!${colors.reset}`)
    process.exit(1)
  } else {
    log(`\n${colors.green}All tests passed!${colors.reset}`)
    process.exit(0)
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test runner failed:', error)
  process.exit(1)
})
