import {
  CompletionItemKind,
  type CompletionList,
  type Connection,
  type TextDocumentPositionParams,
  type TextDocuments,
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { getCompletionSuggestions } from "../../lib/completion";

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

      const suggestions = getCompletionSuggestions(
        doc.getText(),
        lineUpToCursor,
        params.position.character,
      );
      if (!suggestions) return null;

      return {
        isIncomplete: false,
        items: suggestions.map((suggestion) => ({
          label: suggestion.label,
          kind:
            suggestion.kind === "property"
              ? CompletionItemKind.Property
              : CompletionItemKind.Value,
          detail: suggestion.detail,
          textEdit: {
            range: {
              start: {
                line: params.position.line,
                character: suggestion.replacementStart,
              },
              end: {
                line: params.position.line,
                character: suggestion.replacementEnd,
              },
            },
            newText: suggestion.insertText,
          },
        })),
      };
    },
  );
}
