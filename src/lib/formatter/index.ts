/**
 * Ghostty config file formatter.
 *
 * The pure formatting functions have no LSP dependencies and are designed to
 * be extractable into a standalone package in the future.
 */

import { type ParsedLine, parseLine } from "../document";
import { commaKeys, validKeys } from "../schema";
import { DEFAULT_FORMATTER_OPTIONS, type FormatterOptions } from "./types";

// ── Color key sets ───────────────────────────────────────────────────────────

/**
 * Keys whose entire value is a single hex/named color.
 * The `isHexColor` guard means non-hex values pass through untouched.
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

const HEX_RE = /^#?[0-9A-Fa-f]{6}$/;

export type { FormatterOptions, ParsedLine };
export { DEFAULT_FORMATTER_OPTIONS, parseLine };

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
    return value.replace(/[^,]+/g, (segment) => {
      const trimmed = segment.trim();
      const leading = segment.match(/^(\s*)/)?.[1] ?? "";
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
  if (innerEq < 0) return value;
  const prefix = value.slice(0, innerEq + 1);
  const color = value.slice(innerEq + 1);
  return prefix + formatColor(color, opts);
}

export function formatValue(
  key: string,
  rawValue: string,
  opts: FormatterOptions,
): string {
  const value = rawValue.trim();
  if (value === "") return value;

  if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
    return value;
  }

  if (key === "palette") return formatPaletteValue(value, opts);

  if (COMMA_COLOR_KEYS.has(key)) {
    return formatCommaSeparated(value, opts, (t) => formatColor(t, opts));
  }

  if (SCALAR_COLOR_KEYS.has(key)) {
    return formatColor(value, opts);
  }

  if (commaKeys.has(key)) {
    return formatCommaSeparated(value, opts, (t) => formatBoolean(t, opts));
  }

  if (!validKeys.has(key)) return value;

  return formatBoolean(value, opts);
}

export function formatLine(parsed: ParsedLine, opts: FormatterOptions): string {
  if (parsed.type === "blank") return "";
  if (parsed.type === "comment") return parsed.raw;

  if (parsed.type === "unknown") {
    return opts.trimWhitespace ? parsed.raw.trim() : parsed.raw;
  }

  const { key, rawValue, raw, eqIndex } = parsed;
  const value = formatValue(key, rawValue, opts);

  if (opts.equalSpacing === "preserve") {
    const lhsRaw = raw.slice(0, eqIndex);
    const rhsRaw = raw.slice(eqIndex + 1);
    const rhsLeading = rhsRaw.match(/^(\s*)/)?.[1] ?? "";
    const line = `${lhsRaw}=${rhsLeading}${value}`;
    return opts.trimWhitespace ? line.trim() : line;
  }

  if (opts.equalSpacing === "no-space") return `${key}=${value}`;
  return value === "" ? `${key} =` : `${key} = ${value}`;
}

export function formatDocument(text: string, opts: FormatterOptions): string {
  const hadTrailingNewline = text.endsWith("\n");
  const lines = text.split("\n");

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
    } else {
      consecutiveBlanks = 0;
      out.push(formatted);
    }
  }

  const result = out.join("\n");
  return hadTrailingNewline ? `${result}\n` : result;
}
