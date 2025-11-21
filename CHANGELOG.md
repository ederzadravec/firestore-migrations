# Changelog

All notable changes to @ederzadravec/firestore-migrations will be documented in this file.

## [1.0.0] - 2025-01-21

### Added
- ✨ Initial release
- 🎯 Core migration system
  - Execute migrations
  - Rollback migrations
  - Execute seeds
  - Migration tracking and auditing
  - Checksum validation
- 📝 Complete TypeScript support
- 🔌 Framework-agnostic adapter pattern
- 📦 Zero external dependencies (only Node.js crypto)
- 📚 Complete documentation
- 🎨 Templates for migrations, seeds, and adapters
- 🖥️ CLI template
- ✅ Full test coverage (in original project)

### Features
- **Versioning**: All migrations tracked with unique IDs
- **Reversibility**: Full rollback support via `down()`
- **Idempotency**: Safe to run multiple times
- **Audit Trail**: Track who, when, and execution time
- **Validation**: Pre-execution checks via `validate()`
- **Seeds**: Separate seed system for initial data
- **Environment-aware**: Seeds can target specific environments
- **Checksum**: Detect if migration changed after execution

### Documentation
- README.md - Complete documentation
- QUICK_START.md - 5-minute setup guide
- CHANGELOG.md - Version history
- Templates for migrations, seeds, and adapters

## [Unreleased]

### Planned
- [ ] npm package publication
- [ ] CLI as standalone package
- [ ] GitHub repository
- [ ] Additional adapter examples (Firestore Web SDK, etc)
- [ ] Migration generator CLI
- [ ] Dry-run mode
- [ ] Parallel migration execution
- [ ] Migration dependencies
- [ ] Automated tests for library itself
