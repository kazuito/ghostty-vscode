import {
  type Connection,
  DocumentSymbol,
  type DocumentSymbolParams,
  SymbolKind,
  type TextDocuments,
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { getDocumentSymbols } from "./documentSymbols";

export function registerDocumentSymbolProvider(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
): void {
  connection.onDocumentSymbol(
    (params: DocumentSymbolParams): DocumentSymbol[] => {
      const doc = documents.get(params.textDocument.uri);
      if (!doc) return [];

      return getDocumentSymbols(doc.getText()).map((symbol) =>
        DocumentSymbol.create(
          symbol.name,
          undefined,
          SymbolKind.Property,
          symbol.range,
          symbol.selectionRange,
        ),
      );
    },
  );
}
