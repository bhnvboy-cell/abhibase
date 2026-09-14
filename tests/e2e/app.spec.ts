import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login')
    
    // Check page title
    await expect(page).toHaveTitle(/Abhibase/)
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    
    // Click login
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Invalid')).toBeVisible()
  })

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in valid credentials
    await page.fill('input[type="email"]', 'admin@abhibase.com')
    await page.fill('input[type="password"]', 'admin123')
    
    // Click login
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/')
  })
})

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@abhibase.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should display dashboard', async ({ page }) => {
    // Check for dashboard elements
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Projects')).toBeVisible()
    await expect(page.locator('text=Tasks')).toBeVisible()
  })

  test('should have sidebar navigation', async ({ page }) => {
    // Check sidebar is visible
    await expect(page.locator('nav')).toBeVisible()
    
    // Check for navigation links
    await expect(page.locator('a[href="/"]')).toBeVisible()
    await expect(page.locator('a[href="/projects"]')).toBeVisible()
    await expect(page.locator('a[href="/tasks"]')).toBeVisible()
  })
})

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@abhibase.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should navigate to tasks page', async ({ page }) => {
    await page.click('a[href="/tasks"]')
    await expect(page).toHaveURL('/tasks')
    await expect(page.locator('text=Tasks')).toBeVisible()
  })

  test('should display task board', async ({ page }) => {
    await page.goto('/tasks')
    
    // Check for task columns
    await expect(page.locator('text=To Do')).toBeVisible()
    await expect(page.locator('text=In Progress')).toBeVisible()
    await expect(page.locator('text=Done')).toBeVisible()
  })
})

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@abhibase.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should navigate to projects page', async ({ page }) => {
    await page.click('a[href="/projects"]')
    await expect(page).toHaveURL('/projects')
    await expect(page.locator('text=Projects')).toBeVisible()
  })

  test('should display project list', async ({ page }) => {
    await page.goto('/projects')
    
    // Check for project elements
    await expect(page.locator('text=New Project')).toBeVisible()
  })
})

test.describe('AI Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@abhibase.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should navigate to chat page', async ({ page }) => {
    await page.click('a[href="/chat"]')
    await expect(page).toHaveURL('/chat')
    await expect(page.locator('text=AI Chat')).toBeVisible()
  })

  test('should have chat input', async ({ page }) => {
    await page.goto('/chat')
    
    // Check for chat input
    await expect(page.locator('textarea')).toBeVisible()
    await expect(page.locator('button:has-text("Send")')).toBeVisible()
  })
})

test.describe('Website Generator', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@abhibase.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should navigate to website generator', async ({ page }) => {
    await page.click('a[href="/websites"]')
    await expect(page).toHaveURL('/websites')
    await expect(page.locator('text=Website Generator')).toBeVisible()
  })

  test('should display template selection', async ({ page }) => {
    await page.goto('/websites')
    
    // Check for template options
    await expect(page.locator('text=Landing Page')).toBeVisible()
    await expect(page.locator('text=Portfolio')).toBeVisible()
    await expect(page.locator('text=Restaurant')).toBeVisible()
  })
})

test.describe('App Builder', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@abhibase.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should navigate to app builder', async ({ page }) => {
    await page.click('a[href="/app-builder"]')
    await expect(page).toHaveURL('/app-builder')
    await expect(page.locator('text=AI App Builder')).toBeVisible()
  })

  test('should display template gallery', async ({ page }) => {
    await page.goto('/app-builder')
    
    // Check for template options
    await expect(page.locator('text=Freelancer')).toBeVisible()
    await expect(page.locator('text=Content Creator')).toBeVisible()
    await expect(page.locator('text=Student')).toBeVisible()
  })
})

test.describe('Generator Hub', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@abhibase.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should navigate to generator hub', async ({ page }) => {
    await page.click('a[href="/generators"]')
    await expect(page).toHaveURL('/generators')
    await expect(page.locator('text=Generator Hub')).toBeVisible()
  })

  test('should display all 8 generators', async ({ page }) => {
    await page.goto('/generators')
    
    // Check for generator options
    await expect(page.locator('text=Email Templates')).toBeVisible()
    await expect(page.locator('text=Resume/CV')).toBeVisible()
    await expect(page.locator('text=Invoice')).toBeVisible()
    await expect(page.locator('text=Report')).toBeVisible()
    await expect(page.locator('text=Form Builder')).toBeVisible()
    await expect(page.locator('text=Chatbot')).toBeVisible()
    await expect(page.locator('text=Quiz')).toBeVisible()
    await expect(page.locator('text=Logo/Brand')).toBeVisible()
  })
})

test.describe('Security Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@abhibase.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should navigate to security settings', async ({ page }) => {
    await page.click('a[href="/settings/security"]')
    await expect(page).toHaveURL('/settings/security')
    await expect(page.locator('text=Security Settings')).toBeVisible()
  })

  test('should display 2FA option', async ({ page }) => {
    await page.goto('/settings/security')
    
    // Check for 2FA option
    await expect(page.locator('text=Two-Factor Authentication')).toBeVisible()
    await expect(page.locator('text=Enable 2FA')).toBeVisible()
  })

  test('should display active sessions', async ({ page }) => {
    await page.goto('/settings/security')
    
    // Check for sessions section
    await expect(page.locator('text=Active Sessions')).toBeVisible()
  })
})

test.describe('Payment Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@abhibase.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should navigate to payments page', async ({ page }) => {
    await page.click('a[href="/payments"]')
    await expect(page).toHaveURL('/payments')
    await expect(page.locator('text=Payment Tracker')).toBeVisible()
  })

  test('should display invoice list', async ({ page }) => {
    await page.goto('/payments')
    
    // Check for invoice elements
    await expect(page.locator('text=Invoices')).toBeVisible()
    await expect(page.locator('text=New Invoice')).toBeVisible()
  })
})

test.describe('Meeting Notes', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@abhibase.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should navigate to meetings page', async ({ page }) => {
    await page.click('a[href="/meetings"]')
    await expect(page).toHaveURL('/meetings')
    await expect(page.locator('text=Meeting Notes')).toBeVisible()
  })

  test('should display meeting list', async ({ page }) => {
    await page.goto('/meetings')
    
    // Check for meeting elements
    await expect(page.locator('text=Meetings')).toBeVisible()
    await expect(page.locator('text=New Meeting')).toBeVisible()
  })
})
