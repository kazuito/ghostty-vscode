/**
 * Ghostty config file formatter.
 *
 * The pure formatting functions (parseLine → formatValue → formatDocument)
 * have no LSP dependencies and are designed to be extractable into a
 * standalone `ghostty-fmt` package in the future.
 *
 * Only `registerFormatterProvider` depends on vscode-languageserver.
 */

import {
  type Connection,
  type TextDocuments,
  TextEdit,
  Range,
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { ghosttyConfigOptions } from "../shared/schema";
import {
  type FormatterOptions,
  type ParsedLine,
  DEFAULT_FORMATTER_OPTIONS,
} from "../shared/formatter-types";

// ── Schema-derived lookups (built once at module load) ───────────────────────

const validKeys = new Set<string>(ghosttyConfigOptions.map((o) => o.key));
const commaKeys = new Set<string>(
  ghosttyConfigOptions.filter((o) => o.comma).map((o) => o.key),
);

// ── Color key sets ───────────────────────────────────────────────────────────

/**
 * Keys whose entire value is a single hex/named color.
 * The `isHexColor` guard means non-hex values (named colors, "cell-foreground",
 * "bright", "background", "extend", etc.) pass through untouched.
 */
const SCALAR_COLOR_KEYS = new Set([
  "background",
  "foreground",
  "selection-foreground",
  "selection-background",
  "cursor-color",
  "cursor-text",
  "unfocused-split-fill",
  "split-divider-color",
  "search-foreground",
  "search-background",
  "search-selected-foreground",
  "search-selected-background",
  "window-titlebar-background",
  "window-titlebar-foreground",
  "window-padding-color",
  "macos-icon-ghost-color",
  "bold-color",
]);

/** Keys whose comma-separated tokens are each a hex/named color. */
const COMMA_COLOR_KEYS = new Set(["macos-icon-screen-color"]);

// ── Pure formatting helpers ──────────────────────────────────────────────────

const HEX_RE = /^#?[0-9A-Fa-f]{6}$/;

export function isHexColor(token: string): boolean {
  return HEX_RE.test(token);
}

export function formatColor(token: string, opts: FormatterOptions): string {
  if (!isHexColor(token)) return token;
  const bare = token.startsWith("#") ? token.slice(1) : token;
  const cased =
    opts.colorCase === "uppercase"
      ? bare.toUpperCase()
      : opts.colorCase === "lowercase"
        ? bare.toLowerCase()
        : bare;
  return opts.colorAddPrefix ? `#${cased}` : cased;
}

export function formatBoolean(token: string, opts: FormatterOptions): string {
  if (opts.booleanCase === "preserve") return token;
  const lower = token.toLowerCase();
  if (lower === "true") return "true";
  if (lower === "false") return "false";
  return token;
}

export function formatCommaSeparated(
  value: string,
  opts: FormatterOptions,
  tokenFormatter: (token: string) => string,
): string {
  if (opts.commaSpacing === "preserve") {
    // Transform each token but keep original comma whitespace intact.
    return value.replace(/[^,]+/g, (segment) => {
      const trimmed = segment.trim();
      const leading = segment.match(/^(\s*)/)?.[1] ?? ""; // always matches, guards against empty input
      const trailing = segment.match(/(\s*)$/)?.[1] ?? "";
      return `${leading}${tokenFormatter(trimmed)}${trailing}`;
    });
  }
  const sep = opts.commaSpacing === "no-space" ? "," : ", ";
  return value
    .split(/\s*,\s*/)
    .map((t) => tokenFormatter(t.trim()))
    .join(sep);
}

/** Handles the palette special case: value is `<index>=<color>`. */
export function formatPaletteValue(
  value: string,
  opts: FormatterOptions,
): string {
  const innerEq = value.indexOf("=");
  if (innerEq < 0) return value; // malformed — leave untouched
  const prefix = value.slice(0, innerEq + 1); // e.g. "0="
  const color = value.slice(innerEq + 1); // e.g. "#15161e"
  return prefix + formatColor(color, opts);
}

// ── Line parser ──────────────────────────────────────────────────────────────

export function parseLine(raw: string): ParsedLine {
  const trimmed = raw.trimStart();
  if (trimmed === "") return { type: "blank" };
  if (trimmed.startsWith("#")) return { type: "comment", raw };

  const eqIndex = raw.indexOf("=");
  if (eqIndex < 0) return { type: "unknown", raw };

  const key = raw.slice(0, eqIndex).trim();
  if (!key) return { type: "unknown", raw };

  return { type: "entry", key, rawValue: raw.slice(eqIndex + 1), raw, eqIndex };
}

// ── Value formatter ──────────────────────────────────────────────────────────

export function formatValue(
  key: string,
  rawValue: string,
  opts: FormatterOptions,
): string {
  const value = rawValue.trim();
  if (value === "") return value;

  // Quoted strings: leave as-is (font names, titles, keybinds with spaces, etc.)
  if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
    return value;
  }

  // palette: value format is "<index>=<color>" — color is after the inner "="
  if (key === "palette") return formatPaletteValue(value, opts);

  // Comma-separated color tokens (e.g. macos-icon-screen-color)
  if (COMMA_COLOR_KEYS.has(key)) {
    return formatCommaSeparated(value, opts, (t) => formatColor(t, opts));
  }

  // Scalar color value
  if (SCALAR_COLOR_KEYS.has(key)) {
    return formatColor(value, opts);
  }

  // Comma-separated non-color values (boolean flags, enum flags)
  if (commaKeys.has(key)) {
    return formatCommaSeparated(value, opts, (t) => formatBoolean(t, opts));
  }

  // Unknown key: leave value untouched (diagnostics will report it separately)
  if (!validKeys.has(key)) return value;

  // For all remaining valid keys, apply boolean normalization.
  // Non-boolean values (numbers, enums, paths, etc.) pass through unchanged
  // because formatBoolean only transforms "true"/"false" literals.
  return formatBoolean(value, opts);
}

// ── Line assembler ───────────────────────────────────────────────────────────

export function formatLine(parsed: ParsedLine, opts: FormatterOptions): string {
  if (parsed.type === "blank") return "";
  if (parsed.type === "comment") return parsed.raw;

  if (parsed.type === "unknown") {
    return opts.trimWhitespace ? parsed.raw.trim() : parsed.raw;
  }

  const { key, rawValue, raw, eqIndex } = parsed;
  const value = formatValue(key, rawValue, opts);

  if (opts.equalSpacing === "preserve") {
    // Reconstruct the line keeping original spacing around "=", then apply
    // trimWhitespace to handle leading indentation.
    const lhsRaw = raw.slice(0, eqIndex);
    const rhsRaw = raw.slice(eqIndex + 1);
    const rhsLeading = rhsRaw.match(/^(\s*)/)?.[1] ?? "";
    const line = `${lhsRaw}=${rhsLeading}${value}`;
    return opts.trimWhitespace ? line.trim() : line;
  }

  // "space" and "no-space": reconstruct from trimmed key and formatted value.
  // Handle empty value (e.g. "font-family =" resets a key to default) to
  // avoid introducing a spurious trailing space.
  if (opts.equalSpacing === "no-space") return `${key}=${value}`;
  return value === "" ? `${key} =` : `${key} = ${value}`;
}

// ── Document formatter ───────────────────────────────────────────────────────

export function formatDocument(text: string, opts: FormatterOptions): string {
  const hadTrailingNewline = text.endsWith("\n");
  const lines = text.split("\n");

  // When the text ends with "\n", split produces a trailing empty string
  // that represents the phantom line after the last newline. Remove it so we
  // don't double-count blank lines at the end of the file.
  if (hadTrailingNewline && lines[lines.length - 1] === "") {
    lines.pop();
  }

  const out: string[] = [];
  let consecutiveBlanks = 0;

  for (const raw of lines) {
    const parsed = parseLine(raw);
    const formatted = formatLine(parsed, opts);

    if (parsed.type === "blank") {
      if (opts.blankLines === "preserve" || consecutiveBlanks === 0) {
        out.push(formatted);
        consecutiveBlanks++;
      }
      // "collapse": skip additional blank lines beyond the first
    } else {
      consecutiveBlanks = 0;
      out.push(formatted);
    }
  }

  const result = out.join("\n");
  return hadTrailingNewline ? `${result}\n` : result;
}

// ── LSP provider ─────────────────────────────────────────────────────────────

export function registerFormatterProvider(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
): void {
  connection.onDocumentFormatting(async (params) => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) return null;

    const raw = await connection.workspace.getConfiguration({
      scopeUri: params.textDocument.uri,
      section: "ghostty.format",
    });
    const opts: FormatterOptions = {
      ...DEFAULT_FORMATTER_OPTIONS,
      ...(raw ?? {}),
    };

    const original = doc.getText();
    let formatted: string;
    try {
      formatted = formatDocument(original, opts);
    } catch (err) {
      connection.console.error(
        `ghostty formatter failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }

    if (formatted === original) return [];

    const lastLine = doc.lineCount - 1;
    const lastLineLength = doc.getText({
      start: { line: lastLine, character: 0 },
      end: { line: lastLine, character: Number.MAX_SAFE_INTEGER },
    }).length;

    return [
      TextEdit.replace(Range.create(0, 0, lastLine, lastLineLength), formatted),
    ];
  });
}
