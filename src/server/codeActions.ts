import {
  CodeAction,
  CodeActionKind,
  type CodeActionParams,
  type Connection,
  DiagnosticSeverity,
  type TextDocuments,
  TextEdit,
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { ghosttyConfigOptions } from "../shared/schema";
import { extractValues } from "./completion";

const schemaKeys = ghosttyConfigOptions.map((o) => o.key);
const optionMap = new Map(ghosttyConfigOptions.map((o) => [o.key, o]));

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

function closestKeys(input: string, n = 3): string[] {
  return schemaKeys
    .map((k) => ({ key: k, dist: levenshtein(input, k) }))
    .filter(({ dist }) => dist <= 5)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n)
    .map(({ key }) => key);
}

export function registerCodeActionProvider(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
): void {
  connection.onCodeAction((params: CodeActionParams): CodeAction[] => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) return [];

    const uri = params.textDocument.uri;
    const lines = doc.getText().split("\n");
    const actions: CodeAction[] = [];

    for (const diagnostic of params.context.diagnostics) {
      const lineIndex = diagnostic.range.start.line;
      const line = lines[lineIndex] ?? "";

      // Full-line range including trailing newline for deletion
      const lineRangeWithNewline = {
        start: { line: lineIndex, character: 0 },
        end: { line: lineIndex + 1, character: 0 },
      };
      // If last line (no newline after), delete to end of line
      const deleteRange =
        lineIndex + 1 < lines.length
          ? lineRangeWithNewline
          : {
              start: { line: lineIndex, character: 0 },
              end: { line: lineIndex, character: line.length },
            };

      if (diagnostic.severity === DiagnosticSeverity.Warning) {
        // Unknown key — "Remove line"
        actions.push(
          CodeAction.create(
            "Remove line",
            { changes: { [uri]: [TextEdit.del(deleteRange)] } },
            CodeActionKind.QuickFix,
          ),
        );

        // "Did you mean?" suggestions
        const eqIndex = line.indexOf("=");
        const keyPart = eqIndex >= 0 ? line.slice(0, eqIndex) : line;
        const key = keyPart.trim();
        if (key) {
          const keyStart = line.indexOf(key);
          const keyRange = {
            start: { line: lineIndex, character: keyStart },
            end: { line: lineIndex, character: keyStart + key.length },
          };
          for (const suggestion of closestKeys(key)) {
            actions.push(
              CodeAction.create(
                `Did you mean '${suggestion}'?`,
                {
                  changes: { [uri]: [TextEdit.replace(keyRange, suggestion)] },
                },
                CodeActionKind.QuickFix,
              ),
            );
          }
        }
      } else if (diagnostic.severity === DiagnosticSeverity.Information) {
        // Duplicate key — "Remove line"
        actions.push(
          CodeAction.create(
            "Remove line",
            { changes: { [uri]: [TextEdit.del(deleteRange)] } },
            CodeActionKind.QuickFix,
          ),
        );
      } else if (diagnostic.severity === DiagnosticSeverity.Error) {
        // Invalid value — "Replace with <value>"
        const eqIndex = line.indexOf("=");
        if (eqIndex >= 0) {
          const key = line.slice(0, eqIndex).trim();
          const entry = optionMap.get(key);
          if (entry) {
            const values = extractValues(entry.schema);
            if (values) {
              // Use the diagnostic range as the value range
              const valueRange = diagnostic.range;
              for (const value of values.slice(0, 5)) {
                actions.push(
                  CodeAction.create(
                    `Replace with '${value}'`,
                    {
                      changes: { [uri]: [TextEdit.replace(valueRange, value)] },
                    },
                    CodeActionKind.QuickFix,
                  ),
                );
              }
            }
          }
        }
      }
    }

    // Deduplicate by title + uri + range
    const seen = new Set<string>();
    return actions.filter((a) => {
      const key = JSON.stringify({ title: a.title, edit: a.edit });
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });
}
