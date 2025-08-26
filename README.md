# 🏙️ Smart City Dashboard - OpenTelemetry Microfrontend Example

A comprehensive example showcasing **microfrontend architecture** with **OpenTelemetry observability** using the [Honeycomb OpenTelemetry Web distro](https://github.com/honeycombio/honeycomb-opentelemetry-web).

## 🎯 Overview

This project demonstrates:
- **Microfrontend Architecture** using Module Federation
- **OpenTelemetry Integration** for comprehensive observability
- **Dynamic Loading** of microfrontends with error handling
- **Performance Monitoring** and tracing across services
- **Comprehensive Testing** with unit tests and Playwright E2E tests

## 🏗️ Architecture

### Main Shell Application
- **ui-service-shell** - Main container application (Port 8080)

### Microfrontend Services
- **weather-service** - Real-time weather monitoring (Port 8081)
- **traffic-service** - Traffic flow analysis (Port 8082)
- **transit-service** - Public transit tracking (Port 8083)
- **energy-service** - Energy grid monitoring (Port 8084)
- **events-service** - City events and activities (Port 8085)
- **notifications-service** - System alerts and notifications (Port 8086)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/irvingpop/otel-microfrontend-example
cd otel-microfrontend-example

# Install dependencies
npm install

# Install dependencies for all packages
npm run install --workspaces
```

### Environment Setup

Create a `.env` file in the root directory:

```env
# Optional: Your Honeycomb API key for production telemetry
VITE_HONEYCOMB_API_KEY=your-api-key-here

# Development uses demo-key by default
```

### Development

```bash
# Start all services concurrently
npm run

# Or start individual services
npm run start --workspace=ui-service-shell
npm run start --workspace=weather-service

# Restart all the services
npm run restart

# Stop all the services
npm run stop
```

The dashboard will be available at http://localhost:3000

### Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=ui-service-shell
```

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run tests for specific package
npm run test --workspace=ui-service-shell

# Watch mode
npm run test --workspace=weather-service -- --watch
```

### End-to-End Tests
```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/dashboard.spec.ts

# Run with UI mode
npx playwright test --ui
```

## 📊 OpenTelemetry & Observability

### Key Features

1. **Automatic Instrumentation** - Web vitals, user interactions, network requests
2. **Microfrontend Tracking** - Load times, errors, and performance per service
3. **Custom Spans** - Business logic tracing and error tracking
4. **Performance Monitoring** - Real-time performance metrics

### Telemetry Data Structure

The application tracks:
- **Microfrontend Load Events** - `microfrontend.{name}.load`
- **Error Events** - `microfrontend.{name}.error`
- **Render Events** - `microfrontend.{name}.render_error`
- **User Interactions** - Button clicks, navigation, etc.

### Honeycomb Integration

```typescript
// Located in: packages/ui-service-shell/src/lib/telemetry.ts
import { HoneycombWebSDK } from '@honeycombio/opentelemetry-web'

const sdk = new HoneycombWebSDK({
  apiKey: import.meta.env.VITE_HONEYCOMB_API_KEY || 'demo-key',
  serviceName: 'smart-city-dashboard',
  instrumentations: [getWebAutoInstrumentations()]
})
```

### Custom Telemetry Examples

```typescript
// Track microfrontend loading
trackMicrofrontendLoad('weather-service', loadTimeMs)

// Track errors
trackMicrofrontendError('weather-service', error)

// Create custom spans
const span = createMicrofrontendSpan('weather-service', 'data-fetch')
```

## 🛠️ Development Guide

### Adding New Microfrontends

1. **Create Package Structure**
   ```bash
   mkdir -p packages/new-service/src
   cd packages/new-service
   ```

2. **Add Package Configuration**
   ```json
   {
     "name": "new-service",
     "scripts": {
       "dev": "vite",
       "build": "vite build"
     }
   }
   ```

3. **Configure Module Federation**
   ```typescript
   // vite.config.ts
   federation({
     name: 'newService',
     filename: 'remoteEntry.js',
     exposes: {
       './NewWidget': './src/NewWidget.tsx'
     }
   })
   ```

4. **Register in Shell App**
   ```typescript
   // packages/ui-service-shell/src/lib/microfrontendLoader.ts
   export const microfrontends = {
     // ... existing
     newService: {
       name: 'new-service',
       url: 'http://localhost:3007',
       scope: 'newService',
       module: './NewWidget',
       port: 3007
     }
   }
   ```

### Monitoring Best Practices

- **Error Boundaries** - Wrap microfrontends to prevent cascading failures
- **Performance Budgets** - Monitor bundle sizes and load times
- **Graceful Degradation** - Provide fallbacks for failed microfrontends
- **Resource Optimization** - Use shared dependencies efficiently

## 📁 Project Structure

```
otel-microfrontend-example/
├── packages/
│   ├── ui-service-shell/          # Main shell application
│   │   ├── src/
│   │   │   ├── components/        # React components
│   │   │   ├── lib/              # Utilities & telemetry
│   │   │   └── test/             # Test setup
│   │   └── vite.config.ts
│   ├── weather-service/           # Weather microfrontend
│   ├── traffic-service/           # Traffic monitoring
│   ├── transit-service/           # Public transit
│   ├── energy-service/            # Energy grid
│   ├── events-service/            # City events
│   └── notifications-service/     # Alerts & notifications
├── tests/                         # E2E Playwright tests
├── playwright.config.ts           # Test configuration
└── package.json                   # Workspace configuration
```

## 🔧 Troubleshooting

### Common Issues

1. **Microfrontend Not Loading**
   - Check if the service is running on correct port
   - Verify `remoteEntry.js` is accessible
   - Check browser console for CORS errors

2. **Telemetry Not Working**
   - Verify API key configuration
   - Check network tab for telemetry requests
   - Ensure OpenTelemetry SDK initialization

3. **Build Failures**
   - Clear `node_modules` and reinstall
   - Check TypeScript configuration
   - Verify all dependencies are compatible

### Debug Mode

Enable verbose logging:
```bash
DEBUG=1 npm run dev
OTEL_LOG_LEVEL=debug npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Related Links

- [Honeycomb OpenTelemetry Web](https://github.com/honeycombio/honeycomb-opentelemetry-web)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Module Federation](https://module-federation.github.io/)
- [Playwright Testing](https://playwright.dev/)

---

Made with ❤️ for the OpenTelemetry community
