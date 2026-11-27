# Changelog

All notable changes to KafkaForge are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 1: Foundation & Architecture (In Progress)

#### Added
- Project initialization with TypeScript and Node.js ES modules
- Configuration management system with environment variables and validation
- Structured logging with JSON output and context support
- Comprehensive error hierarchy with error codes and cause preservation
- Application lifecycle management with explicit state machine
- Minimal broker domain model
- Foundation utilities (ID generation, timestamps, validation)
- CLI infrastructure with --help and --version support
- Complete test suite using node:test and node:assert/strict
- Architecture documentation and design decisions

#### Planned
- Phase 2: Raw TCP Networking Engine
- Phase 3: Kafka Protocol Implementation
- Phase 4: Topic Management and Storage
- Phase 5: Producer/Consumer APIs
- Phase 6: Replication and High Availability

## Versioning

- **0.1.0** - Phase 1: Foundation & Architecture
- **0.2.0** - Phase 2: Raw TCP Networking Engine
- **1.0.0** - Feature complete core (Phases 1-6)

---

## Development Notes

### Terminology

- **Phase**: A major development milestone covering a significant set of features
- **Checkpoint**: A verification point within a phase
- **Sprint**: A time-boxed development period

### Guidelines

- Each phase delivers a complete, testable, and documented unit of work
- No dependencies on undefined future phases
- Architecture remains extensible for planned phases
- Code quality is not negotiable across phases
