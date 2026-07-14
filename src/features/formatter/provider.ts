import {
  type Connection,
  Range,
  type TextDocuments,
  TextEdit,
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { GHOSTTY_FORMAT_CONFIG_SECTION } from "@/core/constants";
import {
  DEFAULT_FORMATTER_OPTIONS,
  type FormatterOptions,
  formatDocument,
} from ".";

export function registerFormatterProvider(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
): void {
  connection.onDocumentFormatting(async (params) => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) return null;

    const raw = await connection.workspace.getConfiguration({
      scopeUri: params.textDocument.uri,
      section: GHOSTTY_FORMAT_CONFIG_SECTION,
    });
    const opts: FormatterOptions = {
      ...DEFAULT_FORMATTER_OPTIONS,
      ...(raw ?? {}),
    };

    const original = doc.getText();
    let formatted: string;
    try {
      formatted = formatDocument(original, opts);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      connection.console.error(`ghostty formatter failed: ${message}`);
      connection.window.showErrorMessage(
        `Ghostty formatter failed: ${message}`,
      );
      return null;
    }

    if (formatted === original) return [];

    const lastLine = doc.lineCount - 1;
    const lastLineLength = doc.getText({
      start: { line: lastLine, character: 0 },
      end: { line: lastLine, character: Number.MAX_SAFE_INTEGER },
    }).length;

    return [
      TextEdit.replace(Range.create(0, 0, lastLine, lastLineLength), formatted),
    ];
  });
}
