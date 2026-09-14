import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency: number
  error?: string
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: HealthCheck
    memory: HealthCheck
    disk: HealthCheck
    cpu: HealthCheck
  }
  metrics: {
    activeConnections: number
    requestsPerMinute: number
    averageResponseTime: number
    errorRate: number
  }
}

// Simple in-memory metrics store
const metrics = {
  requests: [] as { timestamp: number; duration: number; status: number }[],
  errors: 0,
  totalRequests: 0
}

// Track request metrics
export function trackRequest(duration: number, status: number) {
  metrics.requests.push({
    timestamp: Date.now(),
    duration,
    status
  })
  metrics.totalRequests++
  if (status >= 400) metrics.errors++
  
  // Keep only last minute of requests
  const oneMinuteAgo = Date.now() - 60000
  metrics.requests = metrics.requests.filter(r => r.timestamp > oneMinuteAgo)
}

function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now()
  return query('SELECT 1')
    .then(() => ({
      status: 'healthy' as const,
      latency: Date.now() - start
    }))
    .catch((error: any) => ({
      status: 'unhealthy' as const,
      latency: Date.now() - start,
      error: error.message
    }))
}

function checkMemory(): HealthCheck {
  const used = process.memoryUsage()
  const heapUsedMB = used.heapUsed / 1024 / 1024
  const heapTotalMB = used.heapTotal / 1024 / 1024
  const usagePercent = (heapUsedMB / heapTotalMB) * 100
  
  if (usagePercent > 90) {
    return { status: 'unhealthy', latency: 0, error: `Heap usage: ${usagePercent.toFixed(1)}%` }
  }
  if (usagePercent > 70) {
    return { status: 'degraded', latency: 0, error: `Heap usage: ${usagePercent.toFixed(1)}%` }
  }
  return { status: 'healthy', latency: 0 }
}

function checkDisk(): Promise<HealthCheck> {
  // Simple check - just verify we can write
  const start = Date.now()
  return new Promise((resolve) => {
    try {
      const fs = require('fs')
      const testFile = '/tmp/health-check.txt'
      fs.writeFileSync(testFile, 'test')
      fs.unlinkSync(testFile)
      resolve({ status: 'healthy', latency: Date.now() - start })
    } catch (error: any) {
      resolve({ status: 'unhealthy', latency: Date.now() - start, error: error.message })
    }
  })
}

function checkCpu(): HealthCheck {
  const cpus = require('os').cpus()
  const cpuInfo = cpus[0]
  
  // Calculate CPU usage
  const total = Object.values(cpuInfo.times).reduce((a, b) => a + b, 0)
  const idle = cpuInfo.times.idle
  const usagePercent = ((total - idle) / total) * 100
  
  if (usagePercent > 90) {
    return { status: 'unhealthy', latency: 0, error: `CPU usage: ${usagePercent.toFixed(1)}%` }
  }
  if (usagePercent > 70) {
    return { status: 'degraded', latency: 0, error: `CPU usage: ${usagePercent.toFixed(1)}%` }
  }
  return { status: 'healthy', latency: 0 }
}

export async function GET() {
  try {
    const [dbCheck, memCheck, diskCheck, cpuCheck] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkMemory()),
      checkDisk(),
      Promise.resolve(checkCpu())
    ])
    
    // Calculate metrics
    const oneMinuteAgo = Date.now() - 60000
    const recentRequests = metrics.requests.filter(r => r.timestamp > oneMinuteAgo)
    const requestsPerMinute = recentRequests.length
    const averageResponseTime = recentRequests.length > 0
      ? recentRequests.reduce((a, b) => a + b.duration, 0) / recentRequests.length
      : 0
    const errorRate = metrics.totalRequests > 0
      ? (metrics.errors / metrics.totalRequests) * 100
      : 0
    
    // Determine overall status
    const checks = [dbCheck, memCheck, diskCheck, cpuCheck]
    const hasUnhealthy = checks.some(c => c.status === 'unhealthy')
    const hasDegraded = checks.some(c => c.status === 'degraded')
    
    const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy'
    
    const health: SystemHealth = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      uptime: process.uptime(),
      checks: {
        database: dbCheck,
        memory: memCheck,
        disk: diskCheck,
        cpu: cpuCheck
      },
      metrics: {
        activeConnections: recentRequests.length,
        requestsPerMinute,
        averageResponseTime: Math.round(averageResponseTime),
        errorRate: Math.round(errorRate * 100) / 100
      }
    }
    
    return NextResponse.json(health, {
      status: overallStatus === 'unhealthy' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': overallStatus
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 503 })
  }
}
