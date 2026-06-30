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
- The language server is modular. `src/server/index.ts` only wires providers
  together; VS Code glue lives in `src/server/providers/` and Ghostty/domain
  logic lives in `src/lib/`.
- Builds are bundled with Rolldown into `out/client/index.js` and
  `out/server/index.js`; there is no standalone `pnpm compile` script.
- The server shells out to the Ghostty CLI at startup and during validation to
  load defaults, installed fonts, and CLI diagnostics. That behavior is
  configured by `ghostty.executablePath`.
- The config **key list and descriptions** are generated from Ghostty's
  upstream docs into `src/lib/generated/config-keys.ts` by
  `scripts/gen-config.ts` (run `pnpm gen:config`). The generated file is
  committed; the build never touches the network.
- `src/lib/schema.ts` merges that generated list with a hand-curated overlay
  (`configMetadata`) for the metadata the docs don't expose machine-readably:
  per-key value enums, color/font asset hints, comma-separated semantics, plus
  the `additiveKeys` set and optional description overrides.
- Completion, diagnostics, and quick-fix generation read this merged data
  (`option.enum`, `option.assets`, `option.comma`); there is no longer any Zod
  schema in the config model.
- Formatting logic is intentionally mostly pure and split from LSP glue so it
  can be reused or extracted later.
- Keep `README.md`, `CHANGELOG.md`, and `package.json` aligned with the actual
  shipped feature set.

## Architecture

```text
src/
├── client/
│   └── index.ts           # VSCode entry point; starts the language server
├── lib/
│   ├── codeActions.ts     # Quick-fix suggestion generation
│   ├── completion.ts      # Key/value completion logic
│   ├── diagnostics/       # In-process + Ghostty CLI validation logic
│   ├── document.ts        # Shared config line parsing helpers
│   ├── documentSymbols.ts # Outline symbol generation
│   ├── formatter/         # Pure formatter logic and formatter types
│   ├── generated/         # Generated config keys + descriptions (do not edit)
│   ├── hover.ts           # Hover content generation
│   └── schema.ts          # Merges generated keys with hand-curated metadata
├── server/
│   ├── providers/
│   │   ├── codeActions.ts
│   │   ├── completion.ts
│   │   ├── diagnostics.ts
│   │   ├── documentSymbols.ts
│   │   ├── formatter.ts
│   │   └── hover.ts
│   └── index.ts           # LSP bootstrap; registers providers

src/test/
├── document.test.ts
├── completion.test.ts
├── hover.test.ts
├── diagnostics.test.ts
├── formatter.test.ts
├── codeActions.test.ts
├── documentSymbols.test.ts
├── schema.test.ts
└── helpers.ts
```

The bulk of `schema.ts` is the hand-curated `configMetadata` overlay; the key
list and descriptions live in the generated `src/lib/generated/config-keys.ts`.

Generated output is written to `out/`. Do not hand-edit files there.

### Client (`src/client/index.ts`)

- Uses `vscode-languageclient` to launch `out/server/index.js` over IPC.
- Registers for documents with language ID `ghostty-config`.
- The extension entry point in `package.json` is `./out/client/index.js`.

### Server (`src/server/index.ts`)

- Uses `vscode-languageserver` with Node transport.
- Creates the shared `Connection` and `TextDocuments<TextDocument>` instances.
- Registers hover, completion, diagnostics, formatter, code action, and document
  symbol providers from `src/server/providers/`.
- Advertises incremental sync, hover support, completion support, document
  formatting, code actions, and document symbols.

### Hover (`src/server/providers/hover.ts` + `src/lib/hover.ts`)

- Extracts the key from the hovered line.
- Ignores blank lines and comment lines beginning with `#`.
- Looks up the key in `ghosttyConfigOptions`.
- Returns Markdown with the description, default value when present, and a link
  to `https://ghostty.org/docs/config/reference#<key>`.

### Completion (`src/server/providers/completion.ts` + `src/lib/completion.ts`)

- Before `=`, suggests config keys from `ghosttyConfigOptions`.
- Duplicate keys are filtered out of key completions unless the key is listed in
  `additiveKeys`.
- After `=`, suggests values from each key's `enum` metadata plus named colors
  and installed Ghostty font families for `assets`-tagged keys.
- For comma-separated settings, value completion only replaces the segment after
  the last comma.
- Completion item details include the config description and default value when
  one exists, based on Ghostty defaults loaded at server startup.

### Diagnostics (`src/server/providers/diagnostics.ts` + `src/lib/diagnostics/`)

- `src/lib/diagnostics/` is split into `types.ts` (shared types), `cli.ts`
  (temp-file write + `ghostty +validate-config` shell-out), `parse.ts`
  (CLI output → diagnostics + the unparsed-error safety net), and
  `inProcess.ts` (duplicate-key detection). `index.ts` re-exports them.
- In-process validation only flags duplicate non-additive keys, pointing back to
  the first definition line. Unknown keys and invalid values are detected by the
  CLI, not in-process.
- Delegates value validation to `ghostty +validate-config`, run asynchronously
  when the Ghostty executable is available.
- `ghostty +validate-config` emits two output formats: `file:line:field: msg`
  for a single-source config, and `field: msg` (no source location) once a
  theme or secondary config is loaded. `parseGhosttyOutput` handles both,
  mapping the unlocated form back to its line by key.
- Safety net: when ghostty exits non-zero but no diagnostic could be parsed, the
  raw output is logged and surfaced as a single fallback diagnostic so future
  output-format changes can never fail silently.
- Clears diagnostics when a document closes.

### Formatter (`src/server/providers/formatter.ts` + `src/lib/formatter/index.ts`)

- Exposes whole-document formatting through `textDocument/formatting`.
- Keeps most logic in pure helpers (`parseLine`, `formatValue`,
  `formatDocument`) with no LSP dependency.
- Normalizes spacing around `=`, blank-line runs, hex color casing and `#`
  prefixes, boolean casing, comma spacing, and leading/trailing whitespace.
- Leaves quoted strings and non-hex color names untouched.
- Reads workspace settings from `ghostty.format.*`; defaults live in
  `src/lib/formatter/types.ts`.

### Code Actions (`src/server/providers/codeActions.ts` + `src/lib/codeActions.ts`)

- Provides quick fixes derived from diagnostics.
- Unknown keys get `Remove line` plus up to three `Did you mean ...?`
  suggestions based on Levenshtein distance.
- Duplicate non-additive keys get `Remove line`.
- Invalid enum/literal/boolean values can get up to five `Replace with ...`
  suggestions derived from the schema.

### Document Symbols (`src/server/providers/documentSymbols.ts` + `src/lib/documentSymbols.ts`)

- Returns one `Property` symbol per non-comment, non-blank config line.
- The symbol name is the config key; the selection range covers only the key.
- Powers VSCode Outline and breadcrumb navigation for Ghostty config files.

### Shared Schema (`src/lib/schema.ts`)

- Builds `ghosttyConfigOptions: ConfigEntry[]` (`{ key, desc, enum?, assets?,
  comma? }`) by mapping the generated `configKeys` and merging the hand-curated
  `configMetadata` overlay. Adding a new upstream key needs no edit here unless
  it requires `enum`/`assets`/`comma`.
- Exports `additiveKeys`, `optionByKey`, `validKeys`, and `commaKeys`.
- Regenerate keys/descriptions with `pnpm gen:config`; edit `configMetadata` by
  hand for value/validation metadata.

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

Important: the key alternation and enum-value alternation in
`syntaxes/ghostty-config.tmLanguage.json` are **generated** by
`scripts/gen-config.ts` (the key list from the upstream MDX, the enum values
from `configMetadata`). Run `pnpm gen:config` after key or enum changes rather
than hand-editing those regexes. The surrounding token patterns (strings,
numbers, colors, paths, etc.) are still hand-maintained in the grammar file.
A Vitest drift check (`src/test/generated.test.ts`) asserts the grammar key set
matches the generated key set.

## Build And Verification

```bash
pnpm gen:config # Regenerate config keys/descriptions + grammar from upstream MDX
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

- To pick up upstream config key/description changes, run `pnpm gen:config`
  (fetches the upstream MDX) and commit the regenerated
  `src/lib/generated/config-keys.ts` and grammar. Don't hand-edit the generated
  file or the grammar's key/enum alternations.
- For value/validation metadata (enums, color/font assets, comma semantics),
  edit the `configMetadata` overlay in `src/lib/schema.ts`. `pnpm gen:config`
  reads it to regenerate the grammar's enum alternation.
- If a key is valid multiple times in one file, add it to `additiveKeys`.
- If schema changes affect completion, diagnostics, formatter behavior, or code
  actions, update the relevant Vitest coverage in `src/test/`.
- If you add a new LSP feature module, put pure logic in `src/lib/<feature>.ts`
  when it fits in one file, or `src/lib/<feature>/` when it has multiple
  modules. Keep the LSP adapter in `src/server/providers/`, then register it in
  `src/server/index.ts`.
- If you add or rename formatter settings, update both `package.json` and
  `README.md`.
- When cutting a release, bump `package.json`, add a dated `CHANGELOG.md`
  entry, and keep `README.md` aligned with user-visible settings and runtime
  Ghostty integration behavior.
- Rebundle `out/` before testing the extension in VS Code or publishing it.
