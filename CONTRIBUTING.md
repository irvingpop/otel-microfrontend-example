# Contributing to Smart City Dashboard

Thank you for your interest in contributing! This project demonstrates microfrontend architecture with OpenTelemetry observability.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/otel-microfrontend-example.git
   cd otel-microfrontend-example
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Start development environment**
   ```bash
   npm run dev
   ```

## 📋 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Use meaningful component and variable names

### Testing Requirements
- Add unit tests for new components
- Update E2E tests for UI changes
- Ensure all tests pass before submitting PR

### Commit Messages
Follow conventional commits format:
- `feat:` new features
- `fix:` bug fixes  
- `docs:` documentation changes
- `test:` adding/updating tests
- `refactor:` code refactoring

Example: `feat(weather): add humidity display to weather widget`

## 🏗️ Architecture Guidelines

### Adding New Microfrontends
1. Create new package in `packages/` directory
2. Configure Module Federation in `vite.config.ts`
3. Register in shell app's microfrontend loader
4. Add appropriate telemetry tracking
5. Include comprehensive tests

### OpenTelemetry Integration
- Use existing telemetry utilities in `lib/telemetry.ts`
- Add custom spans for important operations
- Include error tracking and performance monitoring
- Document new telemetry events

### Component Guidelines
- Keep components focused and reusable
- Use proper error boundaries
- Implement loading states
- Add accessibility attributes

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test --workspace=PACKAGE_NAME -- --watch
```

### E2E Tests
```bash
# Install browsers (first time)
npx playwright install

# Run tests
npm run test:e2e

# Debug mode
npx playwright test --debug
```

### Test Coverage
- Aim for >80% coverage on new code
- Test error scenarios and edge cases
- Include integration tests for microfrontend loading

## 📝 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Add/update tests
   - Update documentation if needed

3. **Ensure quality**
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run test:e2e
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: your descriptive commit message"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🐛 Bug Reports

When reporting bugs, please include:
- **Environment** (OS, Node version, browser)
- **Steps to reproduce** the issue
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)
- **Console errors** (if any)

## 💡 Feature Requests

For feature requests:
- Explain the **use case** and **problem** you're trying to solve
- Describe the **proposed solution**
- Consider **alternative approaches**
- Discuss **implementation complexity**

## 🔍 Code Review Process

All PRs require:
- ✅ Passing CI/CD tests
- ✅ Code review approval
- ✅ Up-to-date with main branch
- ✅ Clear commit messages
- ✅ Documentation updates (if needed)

## 🏷️ Release Process

Releases follow semantic versioning:
- **Major** (x.0.0): Breaking changes
- **Minor** (x.y.0): New features, backward compatible
- **Patch** (x.y.z): Bug fixes

## 💬 Getting Help

- **Issues**: Use GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub discussions for questions
- **Discord**: Join OpenTelemetry community Discord

## 📚 Resources

- [OpenTelemetry JavaScript Documentation](https://opentelemetry.io/docs/instrumentation/js/)
- [Honeycomb Documentation](https://docs.honeycomb.io/)
- [Module Federation Guide](https://module-federation.github.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)

Thank you for contributing! 🎉