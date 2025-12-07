# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - Unreleased

### Added
- Markdown support for PoC script descriptions
- Custom modal dialog component to replace browser alerts
- Modal test page accessible from Settings page

### Changed
- Replaced browser `alert()` with custom styled modal dialogs
- PoC management descriptions now support Markdown syntax rendering

### Dependencies
- Added `react-markdown@10.1.0` for Markdown rendering support

## [0.1.0] - 2025-12-07

### Added
- Initial release
- Initial project setup with React + TypeScript + Vite
- Complete FOFA API integration (Search, Stats, Host Aggregation, Account Info, Search After)
- Query history management with SQLite database
- Result export to TXT format
- API key management with secure local storage
- Hacker-style UI with dark theme and terminal aesthetics
- Responsive design for mobile and desktop
- Core FOFA API client functionality
- Query interface with multiple tabs (Search, Stats, Host, Account)
- History page with query management
- Settings page for API key configuration
- Export functionality for query results

### Changed
- Backend server port changed from 3001 to 3002 to avoid conflicts

[Unreleased]: https://github.com/your-username/fofa-sentinel/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/your-username/fofa-sentinel/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-username/fofa-sentinel/releases/tag/v0.1.0

