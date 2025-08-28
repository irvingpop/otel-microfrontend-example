# 🧪 Testing Guide for OpenTelemetry Microfrontend Example

This document outlines comprehensive testing strategies and validation methods for the Smart City Dashboard microfrontend application with OpenTelemetry observability.

## 📋 Table of Contents

1. [Testing Architecture Overview](#testing-architecture-overview)
2. [Environment Setup for Testing](#environment-setup-for-testing)
3. [End-to-End Testing with Playwright](#end-to-end-testing-with-playwright)
4. [OpenTelemetry and Observability Testing](#opentelemetry-and-observability-testing)
5. [Service Health and Integration Testing](#service-health-and-integration-testing)
6. [Honeycomb Validation and Querying](#honeycomb-validation-and-querying)
7. [Manual Testing Procedures](#manual-testing-procedures)
8. [Troubleshooting Common Issues](#troubleshooting-common-issues)
9. [Performance and Load Testing](#performance-and-load-testing)

## 🏗️ Testing Architecture Overview

### Test Types and Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    E2E Tests (Playwright)                  │
├─────────────────────────────────────────────────────────────┤
│               Integration Tests (Service Health)           │
├─────────────────────────────────────────────────────────────┤
│              Observability Tests (Honeycomb)               │
├─────────────────────────────────────────────────────────────┤
│                Unit Tests (Jest/Vitest)                    │
└─────────────────────────────────────────────────────────────┘
```

### Test Environments

- **Development**: Local services with demo API key
- **Staging**: Full services with valid Honeycomb API key  
- **Production**: Live monitoring and alerting validation

## 🔧 Environment Setup for Testing

### Prerequisites

1. **Node.js 18+** and npm
2. **Valid Honeycomb API key** (for full telemetry testing)
3. **Playwright browsers** installed

### Configuration

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Configure with your Honeycomb API key
echo "VITE_HONEYCOMB_API_KEY=your-api-key-here" >> .env
echo "VITE_DEBUG_TELEMETRY=true" >> .env

# 3. Install dependencies
npm install

# 4. Install Playwright browsers
npx playwright install
```

### Validate Environment Setup

```bash
# Check that all services can start
npm run start

# Verify services are healthy
./scripts/check-services.sh

# Run basic connectivity test
curl -f http://localhost:8080
curl -f http://localhost:8081
curl -f http://localhost:8082
```

## 🎭 End-to-End Testing with Playwright

### Test Structure

Located in `tests/opentelemetry.spec.ts`, our E2E tests cover:

- ✅ **Telemetry SDK Initialization**
- ✅ **Microfrontend Dynamic Loading**
- ✅ **User Interaction Flows**
- ✅ **API Key Configuration**

### Running E2E Tests

```bash
# Run all OpenTelemetry tests
npx playwright test tests/opentelemetry.spec.ts

# Run specific test
npx playwright test --grep "telemetry SDK initializes"

# Run with visual browser (debugging)
npx playwright test tests/opentelemetry.spec.ts --headed

# Run on specific browser
npx playwright test tests/opentelemetry.spec.ts --project=chromium

# Generate test report
npx playwright test && npx playwright show-report
```

### Key Test Scenarios

#### 1. Telemetry SDK Initialization Test

```typescript
test('telemetry SDK initializes', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('Smart City Dashboard')
  
  // Validates that OpenTelemetry globals are available
  const hasOtelApi = await page.evaluate(() => {
    return typeof window !== 'undefined' && 
           typeof (window as any).__OTEL_BROWSER_EXT_VERSION__ !== 'undefined'
  })
})
```

**What this tests:**
- Page loads without errors
- OpenTelemetry SDK initializes properly
- No console errors during telemetry setup

#### 2. Microfrontend Telemetry Tracking Test

```typescript
test('microfrontend telemetry tracking works', async ({ page }) => {
  const consoleLogs: string[] = []
  page.on('console', msg => {
    const text = msg.text()
    if (text.includes('Loaded microfrontend') || text.includes('telemetry')) {
      consoleLogs.push(text)
    }
  })

  // Trigger microfrontend loading
  await page.getByText('🚦 Traffic Monitor').click()
  
  // Validate telemetry logs
  const hasMicrofrontendLogs = consoleLogs.some(log => 
    log.includes('Loaded microfrontend') || 
    log.includes('traffic-service')
  )
})
```

**What this tests:**
- Cross-iframe communication works
- Trace context propagation occurs
- Microfrontend loading generates telemetry
- Console logging for debugging

#### 3. Dynamic Loading and User Interactions Test

```typescript
test('tracks user interactions with dynamic loading', async ({ page }) => {
  // Test sequential widget loading
  await page.getByText('⚡ Energy Grid').click()
  await expect(page.locator('.widget-container')).toHaveCount(2)
  
  await page.getByText('📅 City Updates').click() 
  await expect(page.locator('.widget-container')).toHaveCount(4)
  
  // Verify button states
  const activeButtons = page.locator('.control-btn.active')
  await expect(activeButtons).toHaveCount(2)
})
```

**What this tests:**
- Multiple microfrontend loading
- UI state management
- Widget count validation
- Button interaction states

### Console Log Analysis

Our tests capture and analyze console logs to validate:

```javascript
// Expected console patterns
'@honeycombio/opentelemetry-web: 🐝 Honeycomb Web SDK Debug Mode Enabled 🐝'
"@honeycombio/opentelemetry-web: API Key configured for traces: 'hcaik_01...'"
"@honeycombio/opentelemetry-web: Service Name configured for traces: 'traffic-service'"
'✅ Loaded microfrontend: traffic-service'
'🍯 Shell sending trace context: {traceHeaders: Object, traceId: ..., spanId: ...}'
'🍯 Traffic service received message: {traceId: ..., spanId: ...}'
```

## 📊 OpenTelemetry and Observability Testing

### Trace Context Propagation Validation

#### 1. Console Log Verification

Look for these key patterns in test output:

```bash
# UI Shell sending trace context
'🍯 Shell sending trace context: {traceHeaders: Object, traceId: abc123, spanId: def456}'

# Microfrontend receiving context  
'🍯 Traffic service received message: {traceId: abc123, spanId: def456}'

# Parent span context creation
'🍯 Created parent span context: {traceId: abc123, spanId: def456, traceFlags: 1}'

# Child spans with parent context
'🍯 Creating span with parent trace ID: abc123'
```

#### 2. Span Creation Validation

```javascript
// In TrafficWidget.tsx - validates span creation flow
console.log('🍯 Created and ended test span')
console.log('🍯 Creating traffic.load_data span with parent context') 
console.log('🍯 Created traffic.load_data span')
console.log('🍯 Ended traffic.load_data span')
```

#### 3. API Key Configuration Testing

```bash
# Valid API key configuration
"@honeycombio/opentelemetry-web: API Key configured for traces: 'hcaik_01k3hmrgkz1...'"

# Invalid/demo key (should not occur in production)
"@honeycombio/opentelemetry-web: API Key configured for traces: 'demo-key'"
```

### Environment Variable Testing

Validate that centralized environment variables work:

```bash
# Check environment loading in each service
grep -r "VITE_HONEYCOMB_API_KEY" packages/*/vite.config.ts
grep -r "VITE_DEBUG_TELEMETRY" packages/shared/telemetry-config.ts

# Test environment variable inheritance
npm restart
npx playwright test --grep "API key configuration"
```

## 🔍 Service Health and Integration Testing

### Service Startup Validation

```bash
# Start all services
npm run start

# Verify all ports are listening
lsof -i :8080  # ui-service-shell
lsof -i :8081  # weather-service  
lsof -i :8082  # traffic-service
lsof -i :8083  # transit-service
lsof -i :8084  # energy-service
lsof -i :8085  # events-service
lsof -i :8086  # notifications-service
```

### Health Check Scripts

```bash
# Check service health endpoints
./scripts/check-services.sh

# Manual health validation
curl -f http://localhost:8080/
curl -f http://localhost:8081/
curl -f http://localhost:8082/
```

### Service Restart Testing

```bash
# Test graceful restart
npm restart

# Verify services come back up
sleep 5 && ./scripts/check-services.sh

# Test individual service restart  
npm run dev --workspace=traffic-service &
```

## 🍯 Honeycomb Validation and Querying

### Using the Honeycomb MCP Server

Our testing includes direct Honeycomb queries to validate span delivery:

#### 1. Environment and Dataset Discovery

```javascript
// Get workspace context
mcp__honeycomb_ca__get_workspace_context()

// List available environments  
mcp__honeycomb_ca__get_environment('irving-mfe-demo')

// Check dataset columns
mcp__honeycomb_ca__get_dataset_columns('irving-mfe-demo', 'traffic-service')
```

#### 2. Span Validation Queries

```javascript
// Check for recent spans in traffic service
mcp__honeycomb_ca__run_query({
  environment_slug: 'irving-mfe-demo',
  dataset_slug: 'traffic-service', 
  query_spec: {
    calculations: [{ op: 'COUNT' }],
    time_range: 600,
    breakdowns: ['name'],
    orders: [{ op: 'COUNT', order: 'descending' }]
  }
})

// Look for specific trace ID
mcp__honeycomb_ca__run_query({
  environment_slug: 'irving-mfe-demo',
  dataset_slug: 'traffic-service',
  query_spec: {
    calculations: [{ op: 'COUNT' }],
    time_range: 1200,
    filters: [{ column: 'trace.trace_id', op: '=', value: 'abc123def456' }]
  }
})
```

#### 3. Cross-Service Trace Validation

```javascript
// Check if same trace ID appears across services
// UI Service Shell
mcp__honeycomb_ca__run_query({
  environment_slug: 'irving-mfe-demo',
  dataset_slug: 'ui-service-shell',
  query_spec: {
    filters: [{ column: 'trace.trace_id', op: '=', value: 'abc123def456' }],
    breakdowns: ['name', 'service.name']
  }
})

// Traffic Service  
mcp__honeycomb_ca__run_query({
  environment_slug: 'irving-mfe-demo', 
  dataset_slug: 'traffic-service',
  query_spec: {
    filters: [{ column: 'trace.trace_id', op: '=', value: 'abc123def456' }],
    breakdowns: ['name', 'service.name']  
  }
})
```

### Expected Honeycomb Results

#### Service Attribution Validation

```
UI Service Shell Dataset:
- traffic.loaded
- weather.loaded  
- events.loaded
- HTTP GET
- fetchStart/responseEnd

Traffic Service Dataset:  
- traffic.test_span
- traffic.load_data
- traffic.widget_loaded
- Browser performance metrics
```

#### Trace Relationship Validation

Look for spans with:
- ✅ Same `trace.trace_id` across services
- ✅ Proper `trace.parent_id` relationships  
- ✅ Correct `service.name` attribution
- ✅ Expected span names per service

## 🖱️ Manual Testing Procedures

### Visual Validation Checklist

1. **Load Main Dashboard**
   - [ ] Page loads without errors
   - [ ] "Smart City Dashboard" title visible
   - [ ] Weather widget loads initially
   - [ ] Control buttons are present

2. **Test Dynamic Loading**
   - [ ] Click "🚦 Traffic Monitor" - widget appears
   - [ ] Click "⚡ Energy Grid" - second widget appears  
   - [ ] Click "📅 City Updates" - two more widgets appear
   - [ ] Active button states update correctly

3. **Error Handling**
   - [ ] Stop a service and verify error boundary shows
   - [ ] Restart service and verify recovery
   - [ ] Check browser console for errors

### Browser Developer Tools Validation

1. **Console Tab**
   - [ ] No unhandled JavaScript errors
   - [ ] Honeycomb SDK initialization messages
   - [ ] Trace context propagation logs
   - [ ] Microfrontend loading confirmations

2. **Network Tab**  
   - [ ] All iframe sources load successfully
   - [ ] No 404 errors for microfrontend resources
   - [ ] OpenTelemetry spans sent to Honeycomb

3. **Application Tab**
   - [ ] No excessive localStorage usage
   - [ ] Session storage contains trace context

### Cross-Browser Testing

Test on multiple browsers and devices:
- ✅ **Desktop**: Chrome, Firefox, Safari, Edge
- ✅ **Mobile**: Mobile Chrome, Mobile Safari  
- ✅ **Different viewport sizes**

```bash
# Run cross-browser tests
npx playwright test tests/opentelemetry.spec.ts --project=chromium
npx playwright test tests/opentelemetry.spec.ts --project=firefox  
npx playwright test tests/opentelemetry.spec.ts --project=webkit
npx playwright test tests/opentelemetry.spec.ts --project="Mobile Chrome"
```

## 🐛 Troubleshooting Common Issues

### Issue: Spans Not Appearing in Honeycomb

**Symptoms:**
```bash
# Honeycomb query returns 0 results
┌───────┐
│ COUNT │  
├───────┤
│     0 │
└───────┘
```

**Debugging Steps:**

1. **Check API Key Configuration**
```bash
# Look for valid API key in console logs
grep -A5 -B5 "API Key configured" logs/*.log

# Should show: 'hcaik_01k3hmrgkz1...' not 'demo-key'
```

2. **Validate Environment Variables**
```bash
# Check .env file exists and has valid key
cat .env | grep VITE_HONEYCOMB_API_KEY

# Restart services to pick up changes
npm restart
```

3. **Verify Service Configuration**
```bash
# Check vite configs load from root
grep -r "envDir.*\.\." packages/*/vite.config.ts

# Check telemetry config uses env vars  
grep -A10 -B5 "import.meta.env" packages/shared/telemetry-config.ts
```

### Issue: Trace Context Not Propagating

**Symptoms:**
```javascript
// Different trace IDs across services
'🍯 Shell sending trace context: {traceId: abc123}'
'🍯 Traffic service received message: {traceId: def456}'  // Different!
```

**Debugging Steps:**

1. **Check PostMessage Communication**
```javascript
// In browser console, monitor cross-iframe messages
window.addEventListener('message', (e) => {
  if (e.data.type === 'TRACE_CONTEXT_INIT') {
    console.log('Trace context message:', e.data)
  }
})
```

2. **Validate Span Context Creation**
```javascript  
// Look for parent context creation logs
'🍯 Created parent span context: {traceId: abc123, spanId: def456, traceFlags: 1}'
```

3. **Check Session Trace Persistence**
```javascript
// Verify session spans are maintained
'🍯 Shell sending trace context' // Should have consistent traceId
```

### Issue: Services Not Starting

**Symptoms:**
```bash
Error: listen EADDRINUSE: address already in use :::8080
```

**Solutions:**

1. **Kill Existing Processes**
```bash
# Use the restart command instead of manual killing
npm restart

# Or check what's using ports
lsof -i :8080-8086
```

2. **Check Port Conflicts**
```bash  
# Verify expected port assignments
grep -r "port.*80" packages/*/vite.config.ts
```

### Issue: Environment Variables Not Loading

**Symptoms:**
```javascript
"@honeycombio/opentelemetry-web: API Key configured for traces: 'demo-key'"
// Should show actual API key, not demo-key
```

**Solutions:**

1. **Check Vite Config**
```bash
# Verify envDir configuration
grep -A5 -B5 "envDir" packages/*/vite.config.ts

# Should show: envDir: path.resolve(__dirname, '../..')
```

2. **Validate Environment File**
```bash
# Check .env file exists in root
ls -la .env

# Verify contents
cat .env
```

3. **Test Environment Loading**
```bash
# Restart services and check logs
npm restart
grep -r "VITE_HONEYCOMB_API_KEY" logs/*.log
```

## 🚀 Performance and Load Testing

### Microfrontend Loading Performance

```javascript
// Measure microfrontend load times
const startTime = performance.now()
await page.getByText('🚦 Traffic Monitor').click()
await page.waitForSelector('.widget-container:nth-child(2)')
const loadTime = performance.now() - startTime
console.log(`Traffic widget loaded in ${loadTime}ms`)
```

### Memory and Resource Usage

```bash
# Monitor memory usage during tests
top -pid $(pgrep -f "vite") -l 5

# Check for memory leaks
npx playwright test --repeat-each=10 tests/opentelemetry.spec.ts
```

### Concurrent User Simulation

```bash
# Run multiple browser instances
for i in {1..5}; do
  npx playwright test tests/opentelemetry.spec.ts --project=chromium &
done
wait
```

## 📈 Continuous Integration Testing

### GitHub Actions Configuration

```yaml
name: OpenTelemetry Integration Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Install Playwright
        run: npx playwright install
      
      - name: Start services
        run: npm start &
        
      - name: Wait for services
        run: sleep 10
        
      - name: Run E2E tests
        run: npx playwright test
        env:
          VITE_HONEYCOMB_API_KEY: ${{ secrets.HONEYCOMB_API_KEY }}
          VITE_DEBUG_TELEMETRY: true
```

### Test Reporting and Artifacts

```bash
# Generate test report
npx playwright test --reporter=html

# Generate coverage report  
npm run test -- --coverage

# Export test results
npx playwright test --reporter=json > test-results.json
```

## 🎯 Testing Best Practices

### Test Organization

1. **Atomic Tests**: Each test should validate one specific behavior
2. **Independent Tests**: Tests should not depend on each other  
3. **Descriptive Names**: Test names should clearly indicate what is being tested
4. **Setup/Teardown**: Proper service lifecycle management

### Assertion Strategies

```typescript
// Good: Specific, meaningful assertions
await expect(page.locator('.widget-container')).toHaveCount(2)
await expect(activeButtons).toHaveCount(2) 
expect(consoleLogs.some(log => log.includes('traffic-service'))).toBe(true)

// Better: Custom matchers for domain concepts
await expect(page).toHaveLoadedMicrofrontend('traffic-service')
await expect(consoleLogs).toContainTraceContext()
```

### Test Data Management

```typescript
// Use consistent test data
const TEST_TRACE_IDS = {
  VALID_TRACE: 'f9a36b59a7e772de74ab4d22f576408d',
  EXPECTED_SPANS: ['traffic.load_data', 'traffic.widget_loaded']
}

// Parameterized tests for multiple scenarios
['weather-service', 'traffic-service', 'energy-service'].forEach(service => {
  test(`${service} loads correctly`, async ({ page }) => {
    // Test logic
  })
})
```

## 📝 Test Documentation Standards

### Test Case Documentation

Each test should include:
- **Purpose**: What behavior is being validated
- **Setup**: Required environment and preconditions  
- **Steps**: Specific actions performed
- **Assertions**: Expected outcomes and validation
- **Cleanup**: Any required teardown

### Example Test Documentation

```typescript
/**
 * Test: Microfrontend Trace Context Propagation
 * 
 * Purpose: Validates that OpenTelemetry trace context is correctly
 * propagated from the UI shell to child microfrontends via postMessage
 * 
 * Setup:
 * - All services running with valid Honeycomb API key
 * - Debug telemetry enabled
 * - Browser with console logging enabled
 * 
 * Steps:
 * 1. Load main dashboard page
 * 2. Click button to load traffic microfrontend
 * 3. Monitor console logs for trace context messages
 * 4. Verify same trace ID appears in both services
 * 
 * Assertions:
 * - Shell sends trace context with valid trace ID
 * - Traffic service receives same trace ID
 * - Parent span context created successfully
 * - Child spans reference parent trace ID
 * 
 * Success Criteria:
 * - Console shows matching trace IDs across services
 * - No JavaScript errors during context propagation
 * - Spans created with proper parent-child relationships
 */
test('validates cross-iframe trace context propagation', async ({ page }) => {
  // Test implementation
})
```

## 🔄 Regular Testing Procedures

### Daily Development Testing

```bash
# Quick validation during development
npm run start
sleep 5
npx playwright test tests/opentelemetry.spec.ts --grep "telemetry SDK initializes"
npm run stop
```

### Pre-Deployment Testing

```bash
# Full test suite before releases
npm install
npm run build --workspaces  
npm run start
npx playwright test
npm run test --workspaces
./scripts/stop-services.sh
```

### Production Monitoring

```bash
# Validate production telemetry
npm run status
curl -f https://your-domain.com/health
# Check Honeycomb for recent spans
# Monitor error rates and performance metrics
```

---

## 📚 Additional Resources

- [Playwright Testing Documentation](https://playwright.dev/docs/intro)
- [OpenTelemetry JavaScript Documentation](https://opentelemetry.io/docs/instrumentation/js/)
- [Honeycomb Query Documentation](https://docs.honeycomb.io/working-with-data/queries/)
- [Module Federation Testing Strategies](https://webpack.js.org/concepts/module-federation/)

This comprehensive testing guide ensures reliable validation of both the microfrontend architecture and OpenTelemetry observability implementation. Regular execution of these testing procedures helps maintain system reliability and observability effectiveness.