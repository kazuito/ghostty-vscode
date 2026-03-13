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

        const valuePrefix = lineUpToCursor.slice(eqIndex + 1).trimStart();
        const items = values
          .filter((v) => v.startsWith(valuePrefix))
          .map((v) => ({ label: v, kind: CompletionItemKind.Value }));

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

      const items = ghosttyConfigOptions
        .filter(
          (o) =>
            additiveKeys.has(o.key) || !usedKeys.has(o.key) || o.key === prefix,
        )
        .filter((o) => o.key.startsWith(prefix))
        .map((o) => ({
          label: o.key,
          kind: CompletionItemKind.Property,
          detail: o.desc,
          insertText: `${o.key} = `,
        }));

      return { isIncomplete: false, items };
    },
  );
}
