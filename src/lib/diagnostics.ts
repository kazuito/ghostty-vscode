import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseDocument, type Range } from "./document";
import { ghosttyBin, ghosttyEnv } from "./ghostty/ghostty";
import { additiveKeys, validKeys } from "./schema";

export type DiagnosticSeverity = "warning" | "information" | "error";

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

export function createValidationTempPath(): string {
  return join(tmpdir(), `ghostty-validate-${randomBytes(6).toString("hex")}`);
}

export async function runGhosttyValidation(
  content: string,
  executablePath: string,
  tmpPath?: string,
  signal?: AbortSignal,
): Promise<ValidationResult> {
  const validationTmpPath = tmpPath ?? createValidationTempPath();
  const bin = ghosttyBin(executablePath);
  const env = ghosttyEnv(executablePath);
  const shouldDeleteTempFile = tmpPath == null;

  try {
    await writeFile(validationTmpPath, content, "utf8");
    return await new Promise<ValidationResult>((resolve) => {
      execFile(
        bin,
        ["+validate-config", `--config-file=${validationTmpPath}`],
        { timeout: 5000, env, signal },
        (err, stdout, stderr) => {
          const reportedErrors =
            err != null && typeof (err as { code?: unknown }).code === "number";
          resolve({ output: `${stdout}\n${stderr}`, reportedErrors });
        },
      );
    });
  } catch {
    return { output: "", reportedErrors: false };
  } finally {
    if (shouldDeleteTempFile) {
      unlink(validationTmpPath).catch(() => {});
    }
  }
}

function findKeyLine(lines: string[], key: string): number {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const eqIndex = line.indexOf("=");
    const lineKey = (eqIndex >= 0 ? line.slice(0, eqIndex) : line).trim();
    if (lineKey === key) return i;
  }
  return -1;
}

function buildDiagnostic(
  lines: string[],
  lineNum: number,
  field: string,
  message: string,
): ValidationDiagnostic | null {
  if (lineNum < 0 || lineNum >= lines.length) return null;
  const line = lines[lineNum];
  if (!line) return null;

  const eqIndex = line.indexOf("=");
  const isUnknownField = message === "unknown field";
  let start: number;
  let end: number;

  if (!isUnknownField && eqIndex >= 0) {
    const trimmedValue = line.slice(eqIndex + 1).trim();
    start = trimmedValue ? line.indexOf(trimmedValue, eqIndex + 1) : eqIndex + 1;
    end = trimmedValue ? start + trimmedValue.length : start;
  } else {
    const keyInLine = eqIndex >= 0 ? line.slice(0, eqIndex) : line;
    const keyIdx = keyInLine.indexOf(field);
    start = Math.max(0, keyIdx >= 0 ? keyIdx : line.indexOf(field));
    end = start + field.length;
  }

  return {
    range: {
      start: { line: lineNum, character: start },
      end: { line: lineNum, character: end },
    },
    message,
    severity: "error",
  };
}

export function parseGhosttyOutput(
  output: string,
  lines: string[],
): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = [];
  const locatedRegex = /^.+?:(\d+):([^:]+):\s*(.+)$/;
  const unlocatedRegex = /^([A-Za-z0-9_-]+):\s*(.+)$/;

  for (const rawLine of output.split("\n")) {
    const located = rawLine.match(locatedRegex);
    if (located) {
      const diagnostic = buildDiagnostic(
        lines,
        parseInt(located[1], 10) - 1,
        (located[2] ?? "").trim(),
        located[3].trim(),
      );
      if (diagnostic) diagnostics.push(diagnostic);
      continue;
    }

    const unlocated = rawLine.match(unlocatedRegex);
    if (unlocated) {
      const field = unlocated[1].trim();
      const diagnostic = buildDiagnostic(
        lines,
        findKeyLine(lines, field),
        field,
        unlocated[2].trim(),
      );
      if (diagnostic) diagnostics.push(diagnostic);
    }
  }

  return diagnostics;
}

/**
 * Safety net for when ghostty reports config errors (non-zero exit) but
 * {@link parseGhosttyOutput} maps none of them to a line — e.g. ghostty changes
 * its output format again. Surfaces the raw CLI output at the top of the file
 * so the problem is visible instead of being silently swallowed.
 */
export function buildUnparsedErrorsDiagnostic(
  output: string,
  lines: string[],
): ValidationDiagnostic | null {
  const detail = output.trim();
  if (!detail) return null;

  const firstLineLength = lines[0]?.length ?? 0;
  return {
    range: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: firstLineLength },
    },
    message: `Ghostty reported configuration errors that could not be mapped to a line:\n${detail}`,
    severity: "error",
  };
}

export function validateInProcess(text: string): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = [];
  const seenKeys = new Map<string, number>();

  for (const line of parseDocument(text)) {
    const key =
      line.type === "entry"
        ? line.key
        : line.type === "unknown"
          ? line.raw.trim()
          : "";
    if (!key) continue;

    if (!validKeys.has(key)) continue;

    const keyRange =
      line.type === "entry"
        ? line.keyRange
        : {
            start: {
              line: line.line,
              character: line.raw.indexOf(key),
            },
            end: {
              line: line.line,
              character: line.raw.indexOf(key) + key.length,
            },
          };

    if (!additiveKeys.has(key)) {
      if (seenKeys.has(key)) {
        diagnostics.push({
          range: keyRange,
          message: `Duplicate key '${key}' (first defined on line ${(seenKeys.get(key) as number) + 1})`,
          severity: "information",
        });
      } else {
        seenKeys.set(key, line.line);
      }
    }
  }

  return diagnostics;
}
