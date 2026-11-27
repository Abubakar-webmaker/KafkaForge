# Development Documentation

This directory contains guides for developing KafkaForge.

## Quick Start

New developer? Start here:

1. **[Setup](./setup.md)** - Install and verify your environment
2. **[Testing](./testing.md)** - Understand how tests work
3. **[Coding Standards](./coding-standards.md)** - Code style guidelines

## Guides

### [Setup Guide](./setup.md)
- Install Node.js and dependencies
- Verify installation
- Configure your editor
- Common troubleshooting

### [Testing Guide](./testing.md)
- Running tests
- Writing tests
- Testing patterns
- Best practices
- Debugging tests

### [Coding Standards](./coding-standards.md)
- TypeScript requirements
- Naming conventions
- Code organization
- Style guidelines
- Performance tips

## Common Commands

```bash
# Type checking (fast, no compilation)
npm run typecheck

# Full build
npm run build

# Run all tests once
npm test

# Watch tests during development
npm run test:watch

# Test with coverage
npm run test:coverage

# Clean build artifacts
npm run clean

# Start application
npm start

# Development mode (with live reload if configured)
npm run dev
```

## Architecture Guides

For understanding the system design, see `/docs/architecture/`:

- [System Overview](../architecture/system-overview.md) - Architecture and components
- [Project Structure](../architecture/project-structure.md) - File organization
- [Design Decisions](../architecture/design-decisions.md) - Why we made certain choices

## Project Goals (Phase 1)

✅ Configuration management from scratch
✅ Structured logging without third-party deps
✅ Error hierarchy with stable codes
✅ Application lifecycle state machine
✅ Broker domain model
✅ Comprehensive test suite
✅ Complete documentation
✅ Ready for TCP networking (Phase 2)

## Best Practices

### Before Committing

```bash
npm run typecheck    # Catch type errors
npm test             # Verify all tests pass
npm run build        # Ensure clean build
npm run clean        # Remove build artifacts
```

### Writing Code

1. Write test first (TDD approach)
2. Implement feature
3. Verify test passes
4. Add error handling and logging
5. Commit with clear message

### Code Review

- [ ] No `any` types
- [ ] Clear variable/function names
- [ ] Error handling is specific
- [ ] Tests cover the change
- [ ] No dead code
- [ ] TypeScript compiles without warnings

## Getting Help

### Documentation

- Architecture: See `/docs/architecture/`
- Development: This directory
- Project: See `/README.md`

### Common Issues

**TypeScript errors?** → Read [Coding Standards](./coding-standards.md)
**Tests failing?** → Read [Testing Guide](./testing.md)
**Setup problems?** → Read [Setup Guide](./setup.md)

### Questions

For questions about the architecture:
- Check [System Overview](../architecture/system-overview.md)
- Check [Design Decisions](../architecture/design-decisions.md)

## Next Development Phase

Currently in **Phase 1: Foundation & Architecture**

Next phase: **Phase 2: Raw TCP Networking Engine**

- TCP server listening
- Socket connection handling
- Connection lifecycle management
- Error recovery

See [System Overview](../architecture/system-overview.md#future-phases) for future phases.
