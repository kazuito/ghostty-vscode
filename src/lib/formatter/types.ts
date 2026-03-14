/**
 * Types and defaults for the Ghostty config formatter.
 *
 * No LSP or Zod dependencies — designed so the formatting logic can be
 * extracted into a standalone `ghostty-fmt` package in the future.
 */

export interface FormatterOptions {
  /** Spacing around "=". "space" → `key = value`; "no-space" → `key=value`; "preserve" → leave as-is. */
  equalSpacing: "space" | "no-space" | "preserve";
  /** How to handle runs of consecutive blank lines. */
  blankLines: "collapse" | "preserve";
  /** Case normalization applied to hex color digits. */
  colorCase: "uppercase" | "lowercase" | "preserve";
  /** Whether to ensure hex colors are prefixed with "#". */
  colorAddPrefix: boolean;
  /** Case normalization for boolean literals. */
  booleanCase: "lowercase" | "preserve";
  /** Spacing after commas in comma-separated values. */
  commaSpacing: "space" | "no-space" | "preserve";
  /** Remove leading and trailing whitespace from config lines. */
  trimWhitespace: boolean;
}

export const DEFAULT_FORMATTER_OPTIONS: FormatterOptions = {
  equalSpacing: "space",
  blankLines: "collapse",
  colorCase: "uppercase",
  colorAddPrefix: true,
  booleanCase: "lowercase",
  commaSpacing: "space",
  trimWhitespace: true,
};
