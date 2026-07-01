import type { Range } from "../../core/document";

export type DiagnosticSeverity = "warning" | "information" | "error";

/** Literal message ghostty's `+validate-config` emits for an unrecognized key. */
export const UNKNOWN_FIELD_MESSAGE = "unknown field";

/** Prefix of the in-process duplicate-key diagnostic message. */
export const DUPLICATE_KEY_MESSAGE_PREFIX = "Duplicate key ";

export interface ValidationDiagnostic {
  range: Range;
  message: string;
  severity: DiagnosticSeverity;
}

export interface ValidationResult {
  output: string;
  /**
   * True when ghostty ran and exited non-zero, i.e. it found config problems.
   * Distinguishes "config has errors" from "ghostty missing / aborted / timed
   * out" so the caller can detect when error output went unparsed instead of
   * silently dropping it.
   */
  reportedErrors: boolean;
}
