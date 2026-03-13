import {
  type Connection,
  Diagnostic,
  DiagnosticSeverity,
  type TextDocuments,
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type { z } from "zod";
import { additiveKeys, ghosttyConfigOptions } from "../shared/schema";

const validKeys = new Set<string>(ghosttyConfigOptions.map((o) => o.key));
const optionMap = new Map(ghosttyConfigOptions.map((o) => [o.key, o.schema]));

function getZodDef(schema: z.ZodType): Record<string, unknown> {
  return (schema as unknown as { _zod: { def: Record<string, unknown> } })._zod
    .def;
}

function validateValue(schema: z.ZodType, raw: string): string | null {
  const def = getZodDef(schema);
  const type = def.type as string;

  if (type === "boolean") {
    if (raw !== "true" && raw !== "false") {
      return "Expected 'true' or 'false'";
    }
    return null;
  }

  if (type === "number") {
    const n = Number(raw);
    if (Number.isNaN(n)) {
      return "Expected a number";
    }
    const checks = (def.checks as Array<{ kind: string; value: number }>) ?? [];
    for (const check of checks) {
      if (check.kind === "min" && n < check.value) {
        return `Expected a number >= ${check.value}`;
      }
      if (check.kind === "max" && n > check.value) {
        return `Expected a number <= ${check.value}`;
      }
    }
    return null;
  }

  if (type === "enum") {
    const entries = def.entries as Record<string, unknown>;
    if (!(raw in entries)) {
      const allowed = Object.keys(entries).join(", ");
      return `Expected one of: ${allowed}`;
    }
    return null;
  }

  if (type === "literal") {
    const values = def.values as unknown[];
    if (!values.includes(raw)) {
      return `Expected one of: ${values.join(", ")}`;
    }
    return null;
  }

  if (type === "union") {
    const options = (def.options as z.ZodType[]) ?? [];
    // If any option is an unconstrained string, skip validation
    for (const opt of options) {
      const optDef = getZodDef(opt);
      if (
        optDef.type === "string" &&
        !(optDef.checks as unknown[])?.length &&
        !optDef.regex
      ) {
        return null;
      }
    }
    // Try each option; pass if any succeeds
    for (const opt of options) {
      if (validateValue(opt, raw) === null) {
        return null;
      }
    }
    // Build error message from enum/literal/boolean options
    const allowed: string[] = [];
    for (const opt of options) {
      const optDef = getZodDef(opt);
      if (optDef.type === "enum") {
        allowed.push(...Object.keys(optDef.entries as Record<string, unknown>));
      } else if (optDef.type === "literal") {
        allowed.push(...(optDef.values as unknown[]).map(String));
      } else if (optDef.type === "boolean") {
        allowed.push("true", "false");
      }
    }
    if (allowed.length > 0) {
      return `Expected one of: ${[...new Set(allowed)].join(", ")}`;
    }
    return "Invalid value";
  }

  if (type === "string") {
    const result = schema.safeParse(raw);
    if (!result.success) {
      const issue = result.error.issues[0];
      return issue?.message ?? "Invalid value";
    }
    return null;
  }

  return null;
}

function validateDocument(connection: Connection, doc: TextDocument): void {
  const diagnostics: Diagnostic[] = [];
  const lines = doc.getText().split("\n");
  const seenKeys = new Map<string, number>(); // key → first-seen line index

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();

    if (trimmed.startsWith("#") || trimmed === "") continue;

    const eqIndex = line.indexOf("=");
    const keyPart = eqIndex >= 0 ? line.slice(0, eqIndex) : line;
    const key = keyPart.trim();
    if (!key) continue;

    const keyStart = line.indexOf(key);
    const keyRange = {
      start: { line: i, character: keyStart },
      end: { line: i, character: keyStart + key.length },
    };

    // Unknown key → warning
    if (!validKeys.has(key)) {
      diagnostics.push(
        Diagnostic.create(
          keyRange,
          `Unknown Ghostty config key: '${key}'`,
          DiagnosticSeverity.Warning,
        ),
      );
      continue;
    }

    // Duplicate key → info (skip additive keys)
    if (!additiveKeys.has(key)) {
      if (seenKeys.has(key)) {
        diagnostics.push(
          Diagnostic.create(
            keyRange,
            `Duplicate key '${key}' (first defined on line ${(seenKeys.get(key) as number) + 1})`,
            DiagnosticSeverity.Information,
          ),
        );
      } else {
        seenKeys.set(key, i);
      }
    }

    // Value validation → error
    if (eqIndex >= 0) {
      const rawValue = line.slice(eqIndex + 1).trim();
      if (rawValue === "") {
        diagnostics.push(
          Diagnostic.create(
            {
              start: { line: i, character: eqIndex + 1 },
              end: { line: i, character: line.length },
            },
            "Expected a value",
            DiagnosticSeverity.Error,
          ),
        );
      } else {
        const schema = optionMap.get(
          key as Parameters<typeof optionMap.get>[0],
        );
        if (schema) {
          const unquoted =
            rawValue.startsWith('"') && rawValue.endsWith('"') && rawValue.length >= 2
              ? rawValue.slice(1, -1)
              : rawValue;
          const error = validateValue(schema, unquoted);
          if (error) {
            const valueStart = line.indexOf(rawValue, eqIndex + 1);
            diagnostics.push(
              Diagnostic.create(
                {
                  start: { line: i, character: valueStart },
                  end: { line: i, character: valueStart + rawValue.length },
                },
                error,
                DiagnosticSeverity.Error,
              ),
            );
          }
        }
      }
    }
  }

  connection.sendDiagnostics({ uri: doc.uri, diagnostics });
}

export function registerDiagnosticsProvider(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
): void {
  documents.onDidOpen((e) => validateDocument(connection, e.document));
  documents.onDidChangeContent((e) => validateDocument(connection, e.document));
  documents.onDidClose((e) =>
    connection.sendDiagnostics({ uri: e.document.uri, diagnostics: [] }),
  );
}
