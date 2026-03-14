# Ghostty VSCode Extension

A VSCode extension that provides language support for Ghostty terminal
configuration files (`config` filename or `.ghostty` extension).

## Current Project State

- The extension already provides syntax highlighting plus three LSP features:
  hover, completion, and diagnostics.
- The language server is modular. `src/server/server.ts` only wires providers
  together; feature logic lives in separate files.
- `src/shared/schema.ts` is the source of truth for LSP metadata and currently
  defines 202 config keys plus a small set of repeatable "additive" keys.
- Value schemas are not used for full document validation today. Diagnostics only
  check for unknown keys and duplicate non-additive keys.
- `README.md` and `CHANGELOG.md` are minimal; use the source tree and
  `package.json` as the authoritative description of current behavior.

## Architecture

```text
src/
├── client/
│   └── extension.ts       # VSCode entry point; starts the language server
├── server/
│   ├── server.ts          # LSP bootstrap; registers providers
│   ├── hover.ts           # Hover provider
│   ├── completion.ts      # Key/value completions
│   └── diagnostics.ts     # Unknown-key and duplicate-key diagnostics
└── shared/
    └── schema.ts          # Ghostty keys, descriptions, Zod schemas, additive keys
```

You generally don't need to read the entire `schema.ts` file unless necessary, as it is very large (over 1,300 lines).

Generated output is written to `out/`. Do not hand-edit files there.

### Client (`src/client/extension.ts`)

- Uses `vscode-languageclient` to launch `out/server/server.js` over IPC.
- Registers for documents with language ID `ghostty-config`.
- The extension entry point in `package.json` is `out/client/extension.js`.

### Server (`src/server/server.ts`)

- Uses `vscode-languageserver` with Node transport.
- Creates the shared `Connection` and `TextDocuments<TextDocument>` instances.
- Registers hover, completion, and diagnostics providers from sibling modules.
- Advertises incremental sync, hover support, and completion support.

### Hover (`src/server/hover.ts`)

- Extracts the key from the hovered line.
- Ignores blank lines and comment lines beginning with `#`.
- Looks up the key in `ghosttyConfigOptions`.
- Returns Markdown with the description and a link to
  `https://ghostty.org/docs/config/reference#<key>`.

### Completion (`src/server/completion.ts`)

- Before `=`, suggests config keys from `ghosttyConfigOptions`.
- Duplicate keys are filtered out of key completions unless the key is listed in
  `additiveKeys`.
- After `=`, suggests values only when they can be derived from the Zod schema
  as booleans, enums, literals, or unions of those.
- Value extraction currently relies on Zod v4 internals (`schema._zod.def`), so
  completion code is sensitive to Zod implementation changes.

### Diagnostics (`src/server/diagnostics.ts`)

- Publishes a warning for unknown config keys.
- Publishes an informational diagnostic for duplicate non-additive keys, pointing
  back to the first definition line.
- Clears diagnostics when a document closes.
- Does not currently validate value syntax or value types against the Zod schema.

### Shared Schema (`src/shared/schema.ts`)

- Exports `ghosttyConfigOptions` as an `as const` array of `{ key, schema, desc }`.
- Exports `additiveKeys`, which controls both diagnostics and completion
  behavior for repeatable settings such as `keybind`.
- Most language intelligence depends on this file, so new config support usually
  starts here.

## Syntax Highlighting And Language Registration

`package.json` contributes:

- Language ID: `ghostty-config`
- Filenames: `config`
- Extensions: `.ghostty`
- Grammar: `syntaxes/ghostty-config.tmLanguage.json`
- Language configuration: `language-configuration.json`

`language-configuration.json` only defines:

- Line comments with `#`
- Bracket pairs for `[]` and `()`
- Auto-closing and surrounding pairs for brackets and quotes

Important: the TextMate grammar is not generated from `schema.ts`.
`syntaxes/ghostty-config.tmLanguage.json` contains a hard-coded key regex and
hard-coded token patterns. If you add, remove, or rename config keys in
`schema.ts`, you must update the grammar file separately to keep highlighting in
sync.

## Build And Verification

```bash
pnpm compile    # TypeScript build to out/
pnpm watch      # Incremental build
pnpm typecheck  # Type-check without emitting
pnpm lint       # Biome lint on src/
pnpm format     # Biome format --write on src/
```

Notes:

- `prepare` runs `husky`.
- `pnpm test` currently points at `out/test/runTest.js`, but no such file exists
  in this repo today. Treat testing as manual unless a real test harness is
  added.
- `test-config` is a sample Ghostty config file that is useful for quick manual
  verification in VSCode.

## Working Rules For Future Changes

- When adding or changing a config option, update `src/shared/schema.ts` first.
- If a key is valid multiple times in one file, add it to `additiveKeys`.
- Keep `syntaxes/ghostty-config.tmLanguage.json` in sync with any schema key
  changes.
- If you add a new LSP feature module, register it in `src/server/server.ts`.
- Rebuild `out/` before testing the extension in VSCode or publishing it.
