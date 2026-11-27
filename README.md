# KafkaForge

A distributed event streaming platform inspired by Apache Kafka, built entirely in **TypeScript** using **Node.js** built-in APIs.

## About

KafkaForge is designed as a serious long-term engineering project to explore distributed systems concepts from first principles. It is not a Kafka clone or drop-in replacement, but an independent implementation exploring similar architectural patterns.

### Key Design Principles

- **Built from scratch**: No third-party networking, broker, or messaging frameworks
- **TypeScript-first**: Strict type safety throughout
- **Node.js native**: Only Node.js built-in modules for the runtime
- **Production-ready foundation**: Clean, testable, extensible architecture
- **Learning-focused**: Detailed documentation and clear implementations

## Project Status

**Phase 1: Foundation & Architecture** - In Progress

This phase establishes the core foundation:
- Configuration management
- Structured logging system
- Error handling architecture
- Application lifecycle management
- Broker domain model
- Foundation utilities
- CLI infrastructure
- Comprehensive test suite

## Requirements

- **Node.js**: 20.0.0 or later (LTS)
- **npm**: 10.0.0 or later

## Installation

```bash
git clone <repository>
cd kafkaforge
npm install
```

## Development

### Available Scripts

```bash
# Type check
npm run typecheck

# Build
npm run build

# Run tests
npm test

# Watch tests
npm run test:watch

# Test coverage
npm run test:coverage

# Development (requires ts-node setup)
npm run dev

# Production
npm start

# Clean build artifacts
npm run clean
```

### Project Structure

```
kafkaforge/
├── src/
│   ├── app/              # Application lifecycle management
│   ├── broker/           # Broker domain model
│   ├── config/           # Configuration system
│   ├── errors/           # Error hierarchy
│   ├── logging/          # Structured logging
│   ├── types/            # Shared types
│   ├── utils/            # Utility functions
│   ├── cli/              # CLI infrastructure
│   └── index.ts          # Main entry point
├── tests/
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── docs/                 # Documentation
├── scripts/              # Build and utility scripts
└── benchmarks/           # Performance benchmarks
```

## Architecture Overview

### Core Components

#### Configuration Management
- Reads environment variables
- Provides sensible defaults
- Validates all values
- Immutable after loading
- Rejects invalid configuration with descriptive errors

#### Logging
- Structured JSON output to stdout/stderr
- Context-aware child loggers
- Safe error serialization
- Secret redaction
- Circular reference protection

#### Error Handling
- Consistent error hierarchy
- Stable error codes
- Error cause preservation
- Operational classification
- Safe serialization

#### Application Lifecycle
- Explicit state machine (CREATED → INITIALIZING → INITIALIZED → STARTING → RUNNING → STOPPING → STOPPED/FAILED)
- Graceful shutdown with timeout
- Signal handling (SIGINT, SIGTERM)
- Idempotent cleanup
- Resource tracking

#### Broker Foundation
- Minimal domain model
- Identity and state management
- Lifecycle integration
- Ready for TCP, protocol, topics, and storage phases

## Configuration

Configure via environment variables:

```bash
# Application
KAFKAFORGE_ENV=development          # development or production
KAFKAFORGE_LOG_LEVEL=INFO           # DEBUG, INFO, WARN, ERROR
KAFKAFORGE_SHUTDOWN_TIMEOUT_MS=30000

# Broker
KAFKAFORGE_BROKER_ID=broker-1
KAFKAFORGE_HOST=0.0.0.0
KAFKAFORGE_PORT=9092
```

## Testing

KafkaForge uses Node.js built-in test runner with strict assertions.

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

Test categories:
- **Unit tests**: Configuration, logging, errors, utilities, broker
- **Integration tests**: Application lifecycle, signal handling, initialization

## Documentation

See `/docs` for detailed documentation:

- `docs/architecture/` - System design and architectural decisions
- `docs/development/` - Setup, testing, and coding standards

## Limitations (Phase 1)

- No TCP networking
- No Kafka protocol implementation
- No topic management
- No message storage
- No producer/consumer APIs
- No replication
- No persistence layer

These features are planned for subsequent phases.

## License

Apache License 2.0

## Contributing

This is a learning project. Contributions and feedback are welcome.

---

**Next Phase**: Phase 2 - Raw TCP Networking Engine
