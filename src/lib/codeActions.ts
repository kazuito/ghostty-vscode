import type { Range } from "./document";
import {
  extractSchemaValues,
  ghosttyConfigOptions,
  optionByKey,
} from "./schema";

export type DiagnosticSeverity = "warning" | "information" | "error";

export interface DiagnosticLike {
  range: Range;
  message: string;
  severity: DiagnosticSeverity;
}

export interface CodeActionSuggestion {
  title: string;
  edit: {
    range: Range;
    newText: string;
  };
}

const schemaKeys = ghosttyConfigOptions.map((option) => option.key);

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? (dp[i - 1][j - 1] as number)
          : 1 +
            Math.min(
              dp[i - 1][j] as number,
              dp[i][j - 1] as number,
              dp[i - 1][j - 1] as number,
            );
    }
  }
  return dp[m][n] as number;
}

export function closestKeys(input: string, maxResults = 3): string[] {
  return schemaKeys
    .map((key) => ({ key, dist: levenshtein(input, key) }))
    .filter(({ dist }) => dist <= 5)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, maxResults)
    .map(({ key }) => key);
}

export function getCodeActionSuggestions(
  text: string,
  diagnostics: DiagnosticLike[],
): CodeActionSuggestion[] {
  const lines = text.split("\n");
  const suggestions: CodeActionSuggestion[] = [];

  for (const diagnostic of diagnostics) {
    const lineIndex = diagnostic.range.start.line;
    const line = lines[lineIndex] ?? "";
    const deleteRange =
      lineIndex + 1 < lines.length
        ? {
            start: { line: lineIndex, character: 0 },
            end: { line: lineIndex + 1, character: 0 },
          }
        : {
            start: { line: lineIndex, character: 0 },
            end: { line: lineIndex, character: line.length },
          };

    if (diagnostic.severity === "warning") {
      suggestions.push({
        title: "Remove line",
        edit: { range: deleteRange, newText: "" },
      });

      const eqIndex = line.indexOf("=");
      const keyPart = eqIndex >= 0 ? line.slice(0, eqIndex) : line;
      const key = keyPart.trim();
      if (!key) continue;

      const keyStart = line.indexOf(key);
      const keyRange = {
        start: { line: lineIndex, character: keyStart },
        end: { line: lineIndex, character: keyStart + key.length },
      };

      for (const suggestion of closestKeys(key)) {
        suggestions.push({
          title: `Did you mean '${suggestion}'?`,
          edit: { range: keyRange, newText: suggestion },
        });
      }
      continue;
    }

    if (diagnostic.severity === "information") {
      suggestions.push({
        title: "Remove line",
        edit: { range: deleteRange, newText: "" },
      });
      continue;
    }

    const eqIndex = line.indexOf("=");
    if (eqIndex < 0) continue;

    const key = line.slice(0, eqIndex).trim();
    const option = optionByKey.get(key);
    if (!option) continue;

    const values = extractSchemaValues(option.schema);
    if (!values) continue;

    for (const value of values.slice(0, 5)) {
      suggestions.push({
        title: `Replace with '${value}'`,
        edit: { range: diagnostic.range, newText: value },
      });
    }
  }

  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    const key = JSON.stringify(suggestion);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
