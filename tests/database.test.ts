import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getTestPool, closeTestDatabase } from '../setup'

describe('Database Schema Validation', () => {
  let pool: any

  beforeAll(async () => {
    pool = getTestPool()
  })

  afterAll(async () => {
    await closeTestDatabase()
  })

  it('should have all required tables', async () => {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    const tables = result.rows.map((r: any) => r.table_name)
    
    const requiredTables = [
      'users',
      'projects',
      'tasks',
      'files',
      'messages',
      'messages_read',
      'posts',
      'post_likes',
      'post_comments',
      'polls',
      'poll_options',
      'poll_votes',
      'activities',
      'comments',
      'notifications',
      'notification_preferences',
      'profiles',
      'attachments',
      'automations',
      'templates',
      'integrations',
      'branches',
      'invoices',
      'social_posts',
      'meetings',
      'audit_logs',
      'user_sessions',
      'generated_apps',
      'websites'
    ]

    for (const table of requiredTables) {
      expect(tables).toContain(table)
    }
  })

  it('should have users table with required columns', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `)
    
    const columns = result.rows.map((r: any) => r.column_name)
    
    expect(columns).toContain('id')
    expect(columns).toContain('email')
    expect(columns).toContain('password_hash')
    expect(columns).toContain('role')
    expect(columns).toContain('created_at')
  })

  it('should have tasks table with required columns', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position
    `)
    
    const columns = result.rows.map((r: any) => r.column_name)
    
    expect(columns).toContain('id')
    expect(columns).toContain('user_id')
    expect(columns).toContain('title')
    expect(columns).toContain('status')
    expect(columns).toContain('priority')
  })

  it('should have websites table with required columns', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'websites'
      ORDER BY ordinal_position
    `)
    
    const columns = result.rows.map((r: any) => r.column_name)
    
    expect(columns).toContain('id')
    expect(columns).toContain('user_id')
    expect(columns).toContain('name')
    expect(columns).toContain('slug')
    expect(columns).toContain('html')
    expect(columns).toContain('status')
  })

  it('should have generated_apps table with required columns', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'generated_apps'
      ORDER BY ordinal_position
    `)
    
    const columns = result.rows.map((r: any) => r.column_name)
    
    expect(columns).toContain('id')
    expect(columns).toContain('user_id')
    expect(columns).toContain('name')
    expect(columns).toContain('models')
    expect(columns).toContain('installed')
  })

  it('should have proper foreign key constraints', async () => {
    const result = await pool.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `)
    
    // Check that tasks.user_id references users.id
    const taskUserFK = result.rows.find((r: any) => 
      r.table_name === 'tasks' && r.column_name === 'user_id'
    )
    expect(taskUserFK).toBeDefined()
    expect(taskUserFK.foreign_table_name).toBe('users')
  })
})
