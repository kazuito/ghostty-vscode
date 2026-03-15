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

export function createValidationTempPath(): string {
  return join(tmpdir(), `ghostty-validate-${randomBytes(6).toString("hex")}`);
}

export async function runGhosttyValidation(
  content: string,
  executablePath: string,
  tmpPath?: string,
  signal?: AbortSignal,
): Promise<string> {
  const validationTmpPath = tmpPath ?? createValidationTempPath();
  const bin = ghosttyBin(executablePath);
  const env = ghosttyEnv(executablePath);
  const shouldDeleteTempFile = tmpPath == null;

  try {
    await writeFile(validationTmpPath, content, "utf8");
    return await new Promise<string>((resolve) => {
      execFile(
        bin,
        ["+validate-config", `--config-file=${validationTmpPath}`],
        { timeout: 5000, env, signal },
        (_err, stdout, stderr) => {
          resolve(`${stdout}\n${stderr}`);
        },
      );
    });
  } catch {
    return "";
  } finally {
    if (shouldDeleteTempFile) {
      unlink(validationTmpPath).catch(() => {});
    }
  }
}

export function parseGhosttyOutput(
  output: string,
  lines: string[],
): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = [];
  const lineRegex = /^.+?:(\d+):([^:]+):\s*(.+)$/;

  for (const rawLine of output.split("\n")) {
    const match = rawLine.match(lineRegex);
    if (!match) continue;

    const lineNum = parseInt(match[1], 10) - 1;
    const message = match[3].trim();

    if (lineNum < 0 || lineNum >= lines.length) continue;
    const line = lines[lineNum];
    if (!line) continue;

    const eqIndex = line.indexOf("=");
    const isUnknownField = message === "unknown field";
    let start: number;
    let end: number;

    if (!isUnknownField && eqIndex >= 0) {
      const trimmedValue = line.slice(eqIndex + 1).trim();
      start = trimmedValue
        ? line.indexOf(trimmedValue, eqIndex + 1)
        : eqIndex + 1;
      end = trimmedValue ? start + trimmedValue.length : start;
    } else {
      const key = (match[2] ?? "").trim();
      const keyInLine = eqIndex >= 0 ? line.slice(0, eqIndex) : line;
      const keyIdx = keyInLine.indexOf(key);
      start = Math.max(0, keyIdx >= 0 ? keyIdx : line.indexOf(key));
      end = start + key.length;
    }

    diagnostics.push({
      range: {
        start: { line: lineNum, character: start },
        end: { line: lineNum, character: end },
      },
      message,
      severity: "error",
    });
  }

  return diagnostics;
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
