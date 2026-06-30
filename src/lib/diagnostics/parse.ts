import type { ValidationDiagnostic } from "./types";

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
