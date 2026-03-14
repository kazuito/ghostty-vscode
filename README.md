# Ghostty

VSCode language support for [Ghostty](https://ghostty.org) configuration files.

### Features

- **Syntax highlighting** — full tokenization for keys, values, and comments
- **Hover docs** — inline documentation with links to the official reference
- **Completions** — key and value suggestions as you type
- **Diagnostics** — warnings for unknown keys and duplicate entries

### File detection

The extension activates on:

- `**/ghostty/config`
- `**/com.mitchellh.ghostty/config`
- Any file with a `.ghostty` extension

### Install

Search **Ghostty** in the VSCode Extensions panel, or install via the CLI:

```sh
code --install-extension kazuito.ghostty
```

### License

MIT
