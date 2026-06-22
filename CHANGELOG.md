# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-06-22

### Fixed
- Fix secondary list parsing error in term definition files

### Changed
- Adjust CHANGELOG document.

## [1.0.1] - 2026-06-19

### Added
- Add term search command (accessible from command palette)
- Add context menu option for searching selected text as term

### Fixed
- Fix off-by-one line number bug in term anchor positioning
- Fix hover provider registration issue

### Changed
- Refactor command and listener registration into centralized modules
- Update project documentation

## [1.0.0] - 2026-06-11

### Added
- Initial release of Writing Assistant
- Term management:
  - Hover over terms in Markdown files to display summary
  - Click hover card to jump to full term definition
  - Support for alias fields and custom field display
- Word count:
  - Real-time word count in status bar for `.txt` files
  - Support for selection-only counting
  - Configurable exclusion of headers and blank lines
- Multilingual support (English & Simplified Chinese)
- Logger module with log levels and file output

---

*For future changes, updates will be recorded here.*