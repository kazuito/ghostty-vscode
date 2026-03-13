import {
  type Connection,
  Diagnostic,
  DiagnosticSeverity,
  type TextDocuments,
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { additiveKeys, ghosttyConfigOptions } from "../shared/schema";

const validKeys = new Set<string>(ghosttyConfigOptions.map((o) => o.key));

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
