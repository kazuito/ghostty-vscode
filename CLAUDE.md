# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VS Code extension that provides syntax highlighting and language support for Ghostty terminal configuration files. Ghostty is a terminal emulator, and this extension helps users edit their files named `config` in the Ghostty format.

## Key Architecture

### Language Definition
- **Language ID**: `ghostty-config`
- **File Extensions**: files named `config`
- **Scope**: `source.ghostty`

### Core Files
- `package.json`: Extension manifest defining language contributions and grammar location
- `language-configuration.json`: Language configuration for comments, brackets, and auto-closing pairs
- `syntaxes/ghostty-config.tmLanguage.json`: TextMate grammar for syntax highlighting
- `.vscode/launch.json`: Debug configuration for extension development

### Syntax Highlighting Architecture
The TextMate grammar is organized into these main patterns:
- **Comments**: Lines starting with `#`
- **Key-value pairs**: Configuration entries in format `key = value`
- **Config directives**: Special directives like `keybind = clear`

The grammar categorizes Ghostty configuration keys into semantic groups:
- Font properties (`font-family`, `font-size`, etc.)
- Color properties (`background`, `foreground`, `palette`, etc.)
- Cursor properties (`cursor-style`, `cursor-style-blink`, etc.)
- Window properties (`window-padding-x`, `window-decoration`, etc.)
- Mouse properties (`mouse-hide-while-typing`, etc.)
- Terminal properties (`command`, `scrollback-limit`, etc.)
- Platform-specific properties (macOS, Linux, GTK-specific settings)

### Value Types Supported
- Quoted strings (single and double quotes with escape sequences)
- Keybind values with modifiers and actions
- Color values (hex colors, named colors)
- Boolean values (`true`, `false`, `yes`, `no`, `on`, `off`)
- Numeric values (integers, floats, percentages)
- Path values (absolute, relative, home directory paths)
- Enum values (cursor styles, themes, window positions, etc.)

## Development Workflow

### Testing the Extension
1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. Create a test file with `.ghostty` extension or name it `config`
4. Verify syntax highlighting works correctly

### Making Changes
1. Edit the grammar in `syntaxes/ghostty-config.tmLanguage.json`
2. Modify language configuration in `language-configuration.json` if needed
3. Update `package.json` if adding new file patterns or configurations
4. Test changes by reloading the Extension Development Host (`Ctrl+R` or `Cmd+R`)

### Key Development Commands
- **Launch Extension**: Press `F5` in VS Code to open Extension Development Host
- **Reload Extension**: `Ctrl+R` or `Cmd+R` in the Extension Development Host window
- **Debug**: Use the "Extension" launch configuration in VS Code

## Extension Structure

This is a declarative language extension that requires no runtime code - it's purely configuration-driven through:
- Language definition in `package.json`
- Grammar rules in the TextMate grammar file
- Language behavior settings in `language-configuration.json`

The extension automatically activates when users open files matching the configured patterns (`.ghostty` extension or filename `config`).

## Important Notes

- This extension has no dependencies beyond the VS Code engine (^1.101.0)
- No build process or compilation is required - the extension works directly with the JSON configuration files
- The grammar supports the full range of Ghostty configuration options including platform-specific settings
- Keybind syntax is specially handled with support for modifiers, key combinations, and action parameters
