// In-memory cache for development (Redis for production)

interface CacheEntry<T> {
  value: T
  expires: number
  createdAt: number
}

class MemoryCache {
  private store: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL: number = 300 // 5 minutes

  constructor(defaultTTL: number = 300) {
    this.defaultTTL = defaultTTL
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    
    if (!entry) return null
    
    if (Date.now() > entry.expires) {
      this.store.delete(key)
      return null
    }
    
    return entry.value
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL) * 1000
    
    this.store.set(key, {
      value,
      expires,
      createdAt: Date.now()
    })
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  has(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false
    if (Date.now() > entry.expires) {
      this.store.delete(key)
      return false
    }
    return true
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expires) {
        this.store.delete(key)
      }
    }
  }

  getStats() {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys())
    }
  }
}

// Singleton cache instance
export const cache = new MemoryCache()

// Cache wrapper for async functions
export function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): () => Promise<T> {
  return async () => {
    const cached = cache.get<T>(key)
    if (cached !== null) return cached
    
    const result = await fn()
    cache.set(key, result, ttl)
    return result
  }
}

// Cache key generators
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userProjects: (userId: string) => `user:${userId}:projects`,
  project: (projectId: string) => `project:${projectId}`,
  projectTasks: (projectId: string) => `project:${projectId}:tasks`,
  task: (taskId: string) => `task:${taskId}`,
  websites: (userId: string) => `user:${userId}:websites`,
  apps: (userId: string) => `user:${userId}:apps`,
  meetings: (userId: string) => `user:${userId}:meetings`,
  invoices: (userId: string) => `user:${userId}:invoices`,
  socialPosts: (userId: string) => `user:${userId}:social`,
  auditLogs: (userId: string) => `user:${userId}:audit`,
  sessions: (userId: string) => `user:${userId}:sessions`,
}

// Cache TTL constants (in seconds)
export const cacheTTL = {
  short: 60,        // 1 minute
  medium: 300,      // 5 minutes
  long: 3600,       // 1 hour
  veryLong: 86400,  // 24 hours
}

// Example usage with database queries
import { query } from '@/lib/db'

export async function getCachedUser(userId: string) {
  const cached = cache.get(cacheKeys.user(userId))
  if (cached) return cached
  
  const result = await query('SELECT * FROM users WHERE id = $1', [userId])
  const user = result[0]
  
  if (user) {
    cache.set(cacheKeys.user(userId), user, cacheTTL.medium)
  }
  
  return user
}

export async function getCachedProjects(userId: string) {
  const cached = cache.get(cacheKeys.userProjects(userId))
  if (cached) return cached
  
  const result = await query(
    'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  )
  
  cache.set(cacheKeys.userProjects(userId), result, cacheTTL.medium)
  return result
}

export async function invalidateUserCache(userId: string) {
  cache.delete(cacheKeys.user(userId))
  cache.delete(cacheKeys.userProjects(userId))
  cache.delete(cacheKeys.websites(userId))
  cache.delete(cacheKeys.apps(userId))
  cache.delete(cacheKeys.meetings(userId))
  cache.delete(cacheKeys.invoices(userId))
  cache.delete(cacheKeys.socialPosts(userId))
}

export async function invalidateProjectCache(projectId: string) {
  cache.delete(cacheKeys.project(projectId))
  cache.delete(cacheKeys.projectTasks(projectId))
}
