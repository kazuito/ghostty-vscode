# Change Log

All notable changes to the "ghostty" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.0.3] - 2026-03-23

### Added

- Keybind action completions — value completions for the `keybind` key now
  include all available Ghostty actions loaded from the CLI

## [1.0.2] - 2026-03-15

### Added

- Ghostty CLI integration for validation, default value loading, and installed
  font discovery when the `ghostty` executable is available
- A new `ghostty.executablePath` setting for pointing the extension at a
  non-standard Ghostty binary
- Value completions for named colors and installed Ghostty font families

### Changed

- Diagnostics now combine in-process duplicate-key checks with
  `ghostty +validate-config` results for more accurate runtime validation
- Hover and completion details now use Ghostty default values loaded from the
  installed CLI when available
- Configuration descriptions and enum extraction were refreshed for existing
  Ghostty options

### Fixed

- Quick fixes now work with CLI-reported `unknown field` diagnostics, including
  typo suggestions and `Remove line`
- Validation results remain visible while a new CLI validation is pending, with
  improved cancellation and temp-file reuse during edits
- Syntax highlighting now recognizes both 3-digit and 6-digit hex colors more
  reliably

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
