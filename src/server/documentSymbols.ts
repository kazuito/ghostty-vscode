import {
  type Connection,
  DocumentSymbol,
  type DocumentSymbolParams,
  SymbolKind,
  type TextDocuments,
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";

export function registerDocumentSymbolProvider(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
): void {
  connection.onDocumentSymbol(
    (params: DocumentSymbolParams): DocumentSymbol[] => {
      const doc = documents.get(params.textDocument.uri);
      if (!doc) return [];

      const symbols: DocumentSymbol[] = [];
      const lines = doc.getText().split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] as string;
        const trimmed = line.trimStart();
        if (trimmed.startsWith("#") || trimmed === "") continue;

        const eqIndex = line.indexOf("=");
        const keyPart = eqIndex >= 0 ? line.slice(0, eqIndex) : line;
        const key = keyPart.trim();
        if (!key) continue;

        const keyStart = line.indexOf(key);
        const lineRange = {
          start: { line: i, character: 0 },
          end: { line: i, character: line.length },
        };
        const selectionRange = {
          start: { line: i, character: keyStart },
          end: { line: i, character: keyStart + key.length },
        };

        symbols.push(
          DocumentSymbol.create(
            key,
            undefined,
            SymbolKind.Property,
            lineRange,
            selectionRange,
          ),
        );
      }

      return symbols;
    },
  );
}
