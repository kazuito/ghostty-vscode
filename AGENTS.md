# Ghostty VSCode Extension

A VS Code extension that provides language support for Ghostty terminal
configuration files, including formatting, quick fixes, and outline support.
The extension activates for:

- `**/ghostty/config`
- `**/com.mitchellh.ghostty/config`
- Files ending in `.ghostty`

## Current Project State

- The extension ships syntax highlighting plus six language-server features:
  hover, completion, diagnostics, formatting, code actions, and document
  symbols.
- The language server is modular. `src/server/server.ts` only wires providers
  together; feature logic lives in separate files.
- Builds are bundled with Rolldown into `out/client/extension.js` and
  `out/server/server.js`; there is no standalone `pnpm compile` script.
- `src/shared/schema.ts` is the source of truth for config keys, descriptions,
  defaults, repeatable "additive" keys, and comma-separated value metadata.
- Completion, diagnostics, and some quick-fix generation inspect Zod v4
  internals (`schema._zod.def`), so they are sensitive to upstream Zod
  implementation changes.
- Formatting logic is intentionally mostly pure and split from LSP glue so it
  can be reused or extracted later.
- Keep `README.md`, `CHANGELOG.md`, and `package.json` aligned with the actual
  shipped feature set.

## Architecture

```text
src/
├── client/
│   └── extension.ts       # VSCode entry point; starts the language server
├── server/
│   ├── server.ts          # LSP bootstrap; registers providers
│   ├── hover.ts           # Hover provider
│   ├── completion.ts      # Key/value completions
│   ├── diagnostics.ts     # Unknown-key, duplicate-key, and value diagnostics
│   ├── formatter.ts       # Document formatter
│   ├── codeActions.ts     # Quick fixes from diagnostics
│   └── documentSymbols.ts # Outline/breadcrumb symbols
└── shared/
    ├── schema.ts          # Ghostty keys, descriptions, defaults, and Zod schemas
    └── formatter-types.ts # Formatter options and defaults

src/test/
├── completion.test.ts
├── hover.test.ts
├── diagnostics.test.ts
├── formatter.test.ts
├── codeActions.test.ts
├── documentSymbols.test.ts
└── helpers.ts
```

You generally don't need to read the entire `schema.ts` file unless necessary, as it is very large (over 1,300 lines).

Generated output is written to `out/`. Do not hand-edit files there.

### Client (`src/client/extension.ts`)

- Uses `vscode-languageclient` to launch `out/server/server.js` over IPC.
- Registers for documents with language ID `ghostty-config`.
- The extension entry point in `package.json` is `./out/client/extension.js`.

### Server (`src/server/server.ts`)

- Uses `vscode-languageserver` with Node transport.
- Creates the shared `Connection` and `TextDocuments<TextDocument>` instances.
- Registers hover, completion, diagnostics, formatter, code action, and document
  symbol providers from sibling modules.
- Advertises incremental sync, hover support, completion support, document
  formatting, code actions, and document symbols.

### Hover (`src/server/hover.ts`)

- Extracts the key from the hovered line.
- Ignores blank lines and comment lines beginning with `#`.
- Looks up the key in `ghosttyConfigOptions`.
- Returns Markdown with the description, default value when present, and a link
  to `https://ghostty.org/docs/config/reference#<key>`.

### Completion (`src/server/completion.ts`)

- Before `=`, suggests config keys from `ghosttyConfigOptions`.
- Duplicate keys are filtered out of key completions unless the key is listed in
  `additiveKeys`.
- After `=`, suggests values only when they can be derived from the Zod schema
  as booleans, enums, literals, or unions of those.
- For comma-separated settings, value completion only replaces the segment after
  the last comma.
- Completion item details include the config description and default value when
  one exists.
- Value extraction currently relies on Zod v4 internals (`schema._zod.def`), so
  completion code is sensitive to Zod implementation changes.

### Diagnostics (`src/server/diagnostics.ts`)

- Publishes a warning for unknown config keys.
- Publishes an informational diagnostic for duplicate non-additive keys, pointing
  back to the first definition line.
- Publishes error diagnostics for invalid values when the schema can validate
  them, including booleans, numbers and numeric ranges, enums, literals,
  supported unions, regex-backed strings, and comma-separated tokens.
- Clears diagnostics when a document closes.
- Uses Zod internals to derive validation behavior, so schema representation
  changes can affect diagnostics.

### Formatter (`src/server/formatter.ts`)

- Exposes whole-document formatting through `textDocument/formatting`.
- Keeps most logic in pure helpers (`parseLine`, `formatValue`,
  `formatDocument`) with no LSP dependency.
- Normalizes spacing around `=`, blank-line runs, hex color casing and `#`
  prefixes, boolean casing, comma spacing, and leading/trailing whitespace.
- Leaves quoted strings and non-hex color names untouched.
- Reads workspace settings from `ghostty.format.*`; defaults live in
  `src/shared/formatter-types.ts`.

### Code Actions (`src/server/codeActions.ts`)

- Provides quick fixes derived from diagnostics.
- Unknown keys get `Remove line` plus up to three `Did you mean ...?`
  suggestions based on Levenshtein distance.
- Duplicate non-additive keys get `Remove line`.
- Invalid enum/literal/boolean values can get up to five `Replace with ...`
  suggestions derived from the schema.

### Document Symbols (`src/server/documentSymbols.ts`)

- Returns one `Property` symbol per non-comment, non-blank config line.
- The symbol name is the config key; the selection range covers only the key.
- Powers VSCode Outline and breadcrumb navigation for Ghostty config files.

### Shared Schema (`src/shared/schema.ts`)

- Exports `ghosttyConfigOptions` as an `as const` array of
  `{ key, schema, desc, default?, comma? }`.
- Exports `additiveKeys`, which controls both diagnostics and completion
  behavior for repeatable settings such as `keybind`.
- Most language intelligence depends on this file, so new config support usually
  starts here.

## Syntax Highlighting And Language Registration

`package.json` contributes:

- Language ID: `ghostty-config`
- Filename patterns: `**/ghostty/config`, `**/com.mitchellh.ghostty/config`
- Extensions: `.ghostty`
- Grammar: `syntaxes/ghostty-config.tmLanguage.json`
- Language configuration: `language-configuration.json`
- Formatter configuration under `ghostty.format.*`

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
pnpm bundle     # Rolldown bundle to out/
pnpm watch      # Rolldown watch build
pnpm vscode:prepublish # Prepublish bundle hook used by VS Code packaging
pnpm typecheck  # Type-check without emitting
pnpm lint       # Biome lint
pnpm format     # Biome format --write
pnpm test       # Vitest suite under src/test/
```

Notes:

- `prepare` runs `husky`.
- `rolldown.config.ts` controls the client/server bundles emitted into `out/`.
- `config.ghostty` is a sample Ghostty config file that is useful for quick manual
  verification in VSCode.

## Working Rules For Future Changes

- When adding or changing a config option, update `src/shared/schema.ts` first.
- If a key is valid multiple times in one file, add it to `additiveKeys`.
- Keep `syntaxes/ghostty-config.tmLanguage.json` in sync with any schema key
  changes.
- If schema changes affect completion, diagnostics, formatter behavior, or code
  actions, update the relevant Vitest coverage in `src/test/`.
- If you add a new LSP feature module, register it in `src/server/server.ts`.
- If you add or rename formatter settings, update both `package.json` and
  `README.md`.
- Rebundle `out/` before testing the extension in VS Code or publishing it.
