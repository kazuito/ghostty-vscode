# Ghostty VSCode Extension

A VSCode extension that provides language support for Ghostty terminal configuration files (`config` filename or `.ghostty` extension).

## Architecture

```
src/
├── client/
│   └── extension.ts       # VSCode extension entry point; starts the language server
├── server/
│   └── server.ts          # LSP server; implements language features
└── shared/
    └── schema.ts          # Single source of truth: all config keys, Zod schemas, descriptions
```

### Client (`src/client/extension.ts`)
- Uses `vscode-languageclient` to spawn the server as a child process via IPC.
- Activates on documents with language ID `ghostty-config`.

### Server (`src/server/server.ts`)
- Uses `vscode-languageserver` (NodeJS transport).
- Manages open documents via `TextDocuments<TextDocument>`.
- **Hover provider**: parses the key from the hovered line, looks it up in `ghosttyConfigOptions`, and returns the description + a link to `https://ghostty.org/docs/config/reference#<key>`.

### Shared schema (`src/shared/schema.ts`)
- Exports `ghosttyConfigOptions` — an `as const` array of `{ key, schema, desc }` objects.
- `schema` is a Zod validator for the value type.
- `desc` is a short English description used in hover documentation.
- Add new config options here; the server picks them up automatically.

## Language Registration (`package.json` → `contributes`)
- Language ID: `ghostty-config`
- File associations: files named exactly `config`, or with extension `.ghostty`
- Grammar: `syntaxes/ghostty-config.tmLanguage.json` (TextMate, syntax highlighting)
- Language config: `language-configuration.json` (comment syntax `#`, bracket pairs)

## Build

```bash
pnpm compile   # tsc → out/
pnpm watch     # incremental compile
pnpm typecheck # type-check without emit
pnpm lint      # Biome lint
pnpm format    # Biome format
```

Compiled output goes to `out/` (mirroring `src/`). The extension entry point is `out/client/extension.js`.


## Key Dependencies

| Package | Role |
|---|---|
| `vscode-languageclient` | Client-side LSP (extension host) |
| `vscode-languageserver` | Server-side LSP |
| `vscode-languageserver-textdocument` | Document text model for the server |
| `zod` | Value validation schemas in `schema.ts` |
