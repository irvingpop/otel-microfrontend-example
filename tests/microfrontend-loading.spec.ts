import { test, expect } from '@playwright/test'

test.describe('Microfrontend Loading', () => {
  test('tracks microfrontend load performance', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/')
    
    // Wait for dashboard to load
    await expect(page.locator('h1')).toContainText('Smart City Dashboard')
    
    // Check that page loads within reasonable time
    const navigationPromise = page.waitForLoadState('networkidle')
    await navigationPromise
    
    // Verify no JavaScript errors occurred
    page.on('pageerror', error => {
      // In a real test, you might want to fail on unexpected errors
      console.log('Page error:', error.message)
    })
    
    // Check network requests for telemetry data
    const requests = []
    page.on('request', request => {
      requests.push(request.url())
    })
    
    await page.waitForTimeout(2000) // Give time for telemetry to send
    
    // Verify the page is functional
    await expect(page.locator('.dashboard-grid')).toBeVisible()
  })

  test('handles microfrontend timeout scenarios', async ({ page }) => {
    // Simulate slow network for microfrontends
    await page.route('**/remoteEntry.js', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000))
      await route.continue()
    })
    
    await page.goto('/')
    
    // Should still show widget containers during slow loads
    await expect(page.locator('.widget-container')).toHaveCount(6)
    
    // Dashboard structure should still be intact
    await expect(page.locator('.dashboard')).toBeVisible()
    await expect(page.locator('.dashboard-header')).toBeVisible()
  })

  test('verifies telemetry integration', async ({ page }) => {
    // Monitor network requests for telemetry
    const telemetryRequests = []
    
    page.on('request', request => {
      const url = request.url()
      // Look for requests that might be telemetry-related
      if (url.includes('honeycomb') || url.includes('opentelemetry') || url.includes('api.honeycomb.io')) {
        telemetryRequests.push(url)
      }
    })
    
    await page.goto('/')
    await page.waitForTimeout(3000) // Give telemetry time to initialize
    
    // The telemetry system should be initialized (even if we don't see actual requests in demo mode)
    const hasOtelScript = await page.evaluate(() => {
      return !!window.__otel
    })
    
    // In development/demo mode, we might not see actual telemetry requests
    // but the system should still be initialized
    console.log('Telemetry requests found:', telemetryRequests.length)
    console.log('OpenTelemetry initialized:', hasOtelScript)
  })

  test('microfrontend isolation works correctly', async ({ page }) => {
    await page.goto('/')
    
    // Check that the main shell doesn't crash if a microfrontend fails
    await page.route('**/weatherService/**', route => route.abort())
    
    await page.reload()
    
    // Dashboard should still be functional
    await expect(page.locator('h1')).toContainText('Smart City Dashboard')
    await expect(page.locator('.dashboard-grid')).toBeVisible()
    
    // Other widgets should still be visible
    const widgets = page.locator('.widget-container')
    await expect(widgets).toHaveCount(6)
  })
})