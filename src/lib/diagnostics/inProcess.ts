import { parseDocument } from "../document";
import { additiveKeys, validKeys } from "../schema";
import type { ValidationDiagnostic } from "./types";

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
