![banner](https://raw.githubusercontent.com/kazuito/ghostty-vscode/main/assets/banner.png)

# Ghostty LSP

[![Install on VSCode](https://img.shields.io/badge/Install%20on%20VSCode-000000?style=flat)](https://marketplace.visualstudio.com/items?itemName=kazuito.ghostty)
[![GitHub Repo stars](https://img.shields.io/github/stars/kazuito/ghostty-vscode?style=flat&logo=github&labelColor=000&color=000)](https://github.com/kazuito/ghostty-vscode)


VSCode language support for [Ghostty](https://ghostty.org) configuration
files.

Features:

- Syntax highlighting
- Diagnostics
- Completions
- Formatter
- Quick fixes 
- Hover documentation
- Outline and breadcrumbs

## Supported files

The extension activates on:

- `**/ghostty/config`
- `**/com.mitchellh.ghostty/config`
- Any file with a `.ghostty` extension

## Validation and fixes

The language server validates Ghostty config files against the bundled schema.
Today that includes:

- Unknown key warnings
- Duplicate-key diagnostics for non-additive settings
- Value validation for booleans, numbers, enums, literals, regex-backed
  strings, and supported comma-separated options

When a diagnostic has an obvious fix, the extension offers quick actions such
as:

- `Remove line` for unknown or duplicate entries
- `Did you mean ...?` suggestions for mistyped keys
- `Replace with ...` suggestions for invalid boolean, enum, or literal values

## Ghostty executable integration

The extension uses the Ghostty CLI when it is available to:

- run `ghostty +validate-config` for additional diagnostics
- load Ghostty default values so completion details can mark defaults
- load installed font family names for font-related value completion

By default the extension searches the system `PATH` and, on macOS,
`/Applications/Ghostty.app/Contents/MacOS`. If Ghostty is installed elsewhere,
set `ghostty.executablePath` in your VS Code settings.

## Formatting

Use VS Code's **Format Document** command on Ghostty config files. Spacing,
casing, and blank-line handling are configurable under the `ghostty.format.*`
settings in VS Code.

The formatter intentionally leaves quoted strings untouched and preserves
non-hex color names.

## Install

Search **Ghostty** in the VS Code Extensions view, or install it from the CLI:

```sh
code --install-extension kazuito.ghostty
```

This extension requires VS Code `1.91.0` or newer.

## Contributing

Contributions are welcome! Feel free to open an
[issue](https://github.com/kazuito/ghostty-vscode/issues) for bugs or feature
requests, or send a
[pull request](https://github.com/kazuito/ghostty-vscode/pulls).

## License

MIT
