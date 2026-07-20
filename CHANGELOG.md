# VinylScout Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.1] - 2026-07-20

### Added
- Search history tracking in Zustand store (last 10 searches)
- Infrastructure for search history UI integration

## [3.1.0] - 2026-07-20

### Added
- CSV export for collection (separate button from JSON export)
- One-click backup in CSV format for spreadsheet analysis

## [3.0.0] - 2026-07-20

### Added
- Server-side API proxies for Discogs and Claude (all auth keys server-only)
- Rolling backup system for collection storage (vinyl-collection-backup-1..3)
- Expanded vinyl cover analysis: artist, album, year, genre, label/catalog, format
- Structured JSON output from Claude vision for reliable vinyl identification
- Typed error classes for robust API error handling

### Changed
- All Discogs API calls now route through `/api/discogs-proxy` (endpoint allowlist)
- Camera analysis now routes through `/api/analyze` (server-side Claude key)
- Client-side token management completely removed
- Image downscaling (768px max) for reduced API costs
- Collection storage adapter with validation and quota handling

### Fixed
- Camera recognition chain: structured output prevents parsing failures
- Discogs rate-limit handling with proper Retry-After header parsing
- Collection data loss prevention via automatic backup rotation

### Security
- API keys no longer transmitted to or stored on client
- SecureStorage/encrypted token system replaced with server proxies
- Endpoint allowlist prevents Discogs API abuse

## [3.0.1] - 2026-07-20

### Fixed
- Camera capture: pass canvas and video element refs correctly (`.current` property)

## [3.0.2] - 2026-07-20

### Added
- Debug logging for collection storage save operations

## [3.0.3] - 2026-07-20

### Changed
- Simplified storage adapter configuration

## [3.0.4] - 2026-07-20

### Changed
- Lenient backupStorage validation to handle edge cases

## [3.0.5] - 2026-07-20

### Added
- Toast notifications for collection add/remove success and validation errors

### Fixed
- Show validation errors when adding items to collection fails

## [3.0.6] - 2026-07-20

### Fixed
- Handle Zod error objects safely in validateData function

## [3.0.7] - 2026-07-20

### Added
- Detailed validation error logging for debugging

## [3.0.8] - 2026-07-20

### Fixed
- Allow `format` and `label` fields to accept both string and array types (Discogs API compatibility)

## [2.4.0] - 2025-11-17

### Fixed
- **Critical:** Scroll issues in all views (Search, Collection, Stats, Settings)
- Views now properly scroll to top without being cut off
- Added proper scroll container with `height: 100vh` and `overflowY: auto`
- Improved touch scrolling on iOS with `WebkitOverflowScrolling`

### Changed
- Rolled back problematic ESLint fixes from morning that caused black screen
- Restored stable codebase from 2025-11-16
- Updated to version 2.4.0 to mark stable release

### Technical
- All view containers now have consistent scroll properties
- Removed `maxHeight` in favor of `height: 100vh` for better mobile support
- Added `overflowX: hidden` to prevent horizontal scroll issues

## [2.3.3] - 2025-11-16

### Added
- Collection backup/export feature (JSON download)
- Collection import/restore from JSON backup
- Version display in Settings footer
- Granular semantic versioning (2.3.x)

### Fixed
- Camera analysis HTTP 500 error (API key handling)
- Camera feature now uses user's Anthropic API key from Settings

### Changed
- Updated package.json version to 2.3.3
- Export backups now include app version number

## [2.3.2] - 2025-11-16

### Fixed
- Rollback to stable version after refactoring issues
- Restored working app state from before architectural changes

### Removed
- Rolled back experimental refactoring (ThemeContext, extracted hooks)

## [2.3.1] - 2025-11-16 (Unstable)

### Attempted (Rolled Back)
- Major architecture refactoring with custom hooks
- ThemeContext for prop drilling elimination
- Component extraction and code organization

### Issues
- Hook dependency violations causing crashes
- App instability on mobile devices

## [2.3.0] - 2025-11-16

### Added
- Accent color functionality throughout UI
- Advanced search toggle with accent color
- Navigation active indicator with accent color
- Refresh price buttons with accent color

### Fixed
- Accent color setting now visually affects the app

## [2.2.x] - Previous Releases

### Features
- Camera-based vinyl identification
- Collection management with favorites
- Price tracking and history
- Multiple theme support (Classic, Dark, Neon, Forest, Sunset, Midnight)
- Custom color themes
- Statistics and analytics view
- Discogs API integration
- PWA support with offline capabilities

---

## Version Number Format

**MAJOR.MINOR.PATCH** (Semantic Versioning)

- **MAJOR**: Incompatible API changes or major rewrites
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, small improvements

Current: **v2.3.3**
