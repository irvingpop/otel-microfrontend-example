import { test, expect } from '@playwright/test'

test.describe('Smart City Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('loads main dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Smart City Dashboard')
    await expect(page.locator('p')).toContainText('Real-time city monitoring with OpenTelemetry observability')
  })

  test('displays initial state with weather and control buttons', async ({ page }) => {
    // Wait for the dashboard to load
    await expect(page.locator('.dashboard-grid')).toBeVisible()
    
    // Should only show weather widget initially
    const widgets = page.locator('.widget-container')
    await expect(widgets).toHaveCount(1) // Only weather initially
    
    // Check that all control buttons are present
    await expect(page.getByText('🚦 Traffic Monitor')).toBeVisible()
    await expect(page.getByText('🚌 Public Transit')).toBeVisible()
    await expect(page.getByText('⚡ Energy Grid')).toBeVisible()
    await expect(page.getByText('📅 City Updates')).toBeVisible()
  })

  test('dynamically loads microfrontends when buttons are clicked', async ({ page }) => {
    // Initially should only have weather widget
    let widgets = page.locator('.widget-container')
    await expect(widgets).toHaveCount(1)
    
    // Click Traffic Monitor button
    await page.getByText('🚦 Traffic Monitor').click()
    await expect(page.locator('.widget-container')).toHaveCount(2)
    
    // Click Energy Grid button
    await page.getByText('⚡ Energy Grid').click()
    await expect(page.locator('.widget-container')).toHaveCount(3)
    
    // Click City Updates button (loads both events and notifications)
    await page.getByText('📅 City Updates').click()
    await expect(page.locator('.widget-container')).toHaveCount(5)
    
    // Buttons should show active state
    await expect(page.locator('.control-btn.active')).toHaveCount(3) // Traffic, Energy, and City Updates
  })

  test('dashboard is responsive', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('.dashboard-grid')).toBeVisible()
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('.dashboard-grid')).toBeVisible()
    
    // Check that widgets still display in mobile
    const widgets = page.locator('.widget-container')
    await expect(widgets.first()).toBeVisible()
  })

  test('has proper styling and animations', async ({ page }) => {
    const dashboard = page.locator('.dashboard')
    await expect(dashboard).toHaveCSS('background', /linear-gradient/)
    
    // Check widget hover effects (at least CSS is applied)
    const widget = page.locator('.widget-container').first()
    await expect(widget).toHaveCSS('transition', /transform/)
  })

  test('handles service unavailability gracefully', async ({ page }) => {
    // Initially should only have weather widget
    await expect(page.locator('.widget-container')).toHaveCount(1)
    
    // Click a button to load a widget
    await page.getByText('🚦 Traffic Monitor').click()
    await expect(page.locator('.widget-container')).toHaveCount(2)
    
    // Give time for health checks to complete
    await page.waitForTimeout(2000)
    
    // Should see either successful iframes or error boundaries
    const errorBoundaries = page.locator('.error-boundary')
    const iframes = page.locator('iframe')
    
    // At least one element should be present (weather + traffic)
    const totalElements = await errorBoundaries.count() + await iframes.count()
    expect(totalElements).toBeGreaterThanOrEqual(2)
  })
})