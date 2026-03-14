# Change Log

All notable changes to the "ghostty" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.0.1] - 2026-03-14

### Added

- Document formatting for Ghostty config files with configurable spacing, color
  normalization, boolean normalization, comma spacing, blank-line handling, and
  whitespace trimming
- Quick fixes for unknown keys, duplicate non-additive keys, and invalid
  boolean/enum/literal values
- Outline and breadcrumb support via document symbols

### Changed

- Diagnostics now validate schema-backed value types in addition to unknown and
  duplicate keys
- README, maintainer notes, and marketplace metadata now describe the current
  feature set and formatter settings

## [1.0.0] - 2026-03-14

- Initial release
- Syntax highlighting for Ghostty configuration files
- Hover documentation with links to the official reference
- Key and value completions
- Diagnostics for unknown keys and duplicate entries
