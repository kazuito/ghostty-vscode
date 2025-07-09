# Ghostty VSCode Extension

A comprehensive VSCode extension that provides rich language support for [Ghostty](https://ghostty.org/) terminal configuration files.

## Features

### Syntax Highlighting
- Full syntax highlighting for Ghostty configuration files
- Support for comments, key-value pairs, and special directives
- Color-coded values including hex colors, keybinds, and enums

### Intelligent IntelliSense
- **Auto-completion** for all 160+ Ghostty configuration keys
- **Context-aware suggestions** for configuration values
- **Smart keybind completion** with modifier keys and actions
- **Built-in theme suggestions** with light/dark combinations
- **Color completion** with hex values and named colors

### Rich Documentation
- **Hover documentation** with detailed descriptions
- **Examples and valid values** for each configuration key
- **Platform-specific information** (macOS, Linux, GTK)
- **Deprecation warnings** for outdated options

### Real-time Validation
- **Error detection** for invalid configuration keys
- **Value validation** with type checking
- **Duplicate key warnings**
- **Platform-specific validation**

## Supported Files

The extension automatically activates for:
- Files named `config` (standard Ghostty configuration)
- Files with `.ghostty` extension

## Language Server Features

This extension includes a full-featured language server that provides:

- **Completion Provider**: Intelligent autocomplete for keys and values
- **Hover Provider**: Rich documentation on hover
- **Diagnostics Provider**: Real-time error detection and validation
- **Configuration Schema**: Complete schema with all Ghostty options

## Installation

1. Install from VSCode Marketplace (when published)
2. Or install from `.vsix` file:
   ```bash
   code --install-extension ghostty-config-x.x.x.vsix
   ```

## Development

### Prerequisites
- Node.js 18+ 
- VSCode 1.101.0+

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd ghostty-vscode-extension

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Launch Extension Development Host
npm run dev
```

### Testing
1. Press `F5` to open Extension Development Host
2. Create a test file named `config` or with `.ghostty` extension
3. Test syntax highlighting, completion, hover, and diagnostics

### Build
```bash
# Compile TypeScript
npm run compile

# Package extension
npm run package
```

## Configuration Schema

The extension includes a comprehensive schema covering all Ghostty configuration options:

### Color Settings
- `background`, `foreground`, `cursor-color`
- `palette` entries (0-15)
- `selection-background`, `selection-foreground`

### Font Settings
- `font-family`, `font-size`, `font-weight`
- `font-style`, `font-variation`
- `font-codepoint-map`

### Window Settings
- `window-padding-x`, `window-padding-y`
- `window-decoration`, `window-title`
- `window-save-state`, `window-new-tab-position`

### Cursor Settings
- `cursor-style`, `cursor-style-blink`
- `cursor-invert-fg-bg`, `cursor-opacity`

### Terminal Settings
- `scrollback-limit`, `command`
- `copy-on-select`, `mouse-hide-while-typing`
- `confirm-close-surface`, `quit-after-last-window-closed`

### Keybinds
- Full modifier key support (`ctrl`, `alt`, `shift`, `super`)
- Action autocompletion
- Performable keybind syntax
- Key sequence support

### Themes
- Built-in theme suggestions
- Light/dark theme combinations
- Custom theme path support

## Architecture

### Project Structure
```
├── src/
│   ├── client/           # VSCode extension client
│   ├── server/           # Language server implementation
│   └── shared/           # Shared types and schema
├── syntaxes/             # TextMate grammar
├── language-configuration.json
└── package.json
```

### Language Server Components
- **Parser**: Robust INI-style configuration parser
- **Schema**: Complete Ghostty configuration schema
- **Completion**: Context-aware completion provider
- **Hover**: Rich documentation provider
- **Diagnostics**: Real-time validation and error detection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built for the [Ghostty](https://ghostty.org/) terminal emulator
- Uses VSCode Language Server Protocol
- Syntax highlighting based on TextMate grammar
