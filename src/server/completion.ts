import {
  CompletionItemKind,
  type CompletionList,
  type Connection,
  type TextDocumentPositionParams,
  type TextDocuments,
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type { z } from "zod";
import { additiveKeys, ghosttyConfigOptions } from "../shared/schema";

function extractValues(schema: z.ZodType): string[] | null {
  // Zod v4: internal def is at schema._zod.def
  const def = (schema as unknown as { _zod: { def: Record<string, unknown> } })
    ._zod.def;
  switch (def.type) {
    case "boolean":
      return ["true", "false"];
    case "enum":
      return Object.keys(def.entries as Record<string, unknown>);
    case "literal":
      return (def.values as unknown[]).map(String);
    case "union": {
      const results: string[] = [];
      for (const opt of def.options as z.ZodType[]) {
        const vals = extractValues(opt);
        if (vals) results.push(...vals);
      }
      return results.length > 0 ? results : null;
    }
    default:
      return null;
  }
}

export function registerCompletionProvider(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
): void {
  connection.onCompletion(
    (params: TextDocumentPositionParams): CompletionList | null => {
      const doc = documents.get(params.textDocument.uri);
      if (!doc) return null;

      const lineUpToCursor = doc.getText({
        start: { line: params.position.line, character: 0 },
        end: {
          line: params.position.line,
          character: params.position.character,
        },
      });

      if (lineUpToCursor.trimStart().startsWith("#")) return null;

      const eqIndex = lineUpToCursor.indexOf("=");

      // --- Value completion (cursor is after '=') ---
      if (eqIndex >= 0) {
        const key = lineUpToCursor.slice(0, eqIndex).trim();
        const option = ghosttyConfigOptions.find((o) => o.key === key);
        if (!option) return null;

        const values = extractValues(option.schema);
        if (!values) return null;

        const afterEq = lineUpToCursor.slice(eqIndex + 1);

        // For comma-separated keys, complete only the segment after the last comma
        let valuePrefix: string;
        if (option.comma) {
          const lastComma = afterEq.lastIndexOf(",");
          valuePrefix =
            lastComma >= 0
              ? afterEq.slice(lastComma + 1).trimStart()
              : afterEq.trimStart();
        } else {
          valuePrefix = afterEq.trimStart();
        }

        const valuePrefixStart = params.position.character - valuePrefix.length;

        const defaultVal =
          option.default !== undefined ? String(option.default) : undefined;

        const items = values
          .filter((v) => v.startsWith(valuePrefix))
          .map((v) => ({
            label: v,
            kind: CompletionItemKind.Value,
            detail:
              defaultVal !== undefined && v === defaultVal
                ? "default"
                : undefined,
            textEdit: {
              range: {
                start: {
                  line: params.position.line,
                  character: valuePrefixStart,
                },
                end: {
                  line: params.position.line,
                  character: params.position.character,
                },
              },
              newText: v,
            },
          }));

        return { isIncomplete: false, items };
      }

      // --- Key completion (cursor is before '=') ---
      const usedKeys = new Set<string>();
      for (const l of doc.getText().split("\n")) {
        const t = l.trimStart();
        if (t.startsWith("#") || t === "") continue;
        const eq = l.indexOf("=");
        const k = (eq >= 0 ? l.slice(0, eq) : l).trim();
        if (k) usedKeys.add(k);
      }

      const prefix = lineUpToCursor.trim();
      const prefixStart = lineUpToCursor.length - prefix.length;

      const items = ghosttyConfigOptions
        .filter(
          (o) =>
            additiveKeys.has(o.key) || !usedKeys.has(o.key) || o.key === prefix,
        )
        .filter((o) => o.key.startsWith(prefix))
        .map((o) => ({
          label: o.key,
          kind: CompletionItemKind.Property,
          detail:
            o.default !== undefined
              ? `${o.desc} Default: ${o.default}`
              : o.desc,
          textEdit: {
            range: {
              start: { line: params.position.line, character: prefixStart },
              end: {
                line: params.position.line,
                character: params.position.character,
              },
            },
            newText: `${o.key} = `,
          },
        }));

      return { isIncomplete: false, items };
    },
  );
}
