import type {
  Connection,
  Hover,
  TextDocumentPositionParams,
  TextDocuments,
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { ghosttyConfigOptions } from "../shared/schema";

export function registerHoverProvider(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
): void {
  connection.onHover((params: TextDocumentPositionParams): Hover | null => {
    const doc = documents.get(params.textDocument.uri);
    if (!doc) return null;

    const line = doc.getText({
      start: { line: params.position.line, character: 0 },
      end: { line: params.position.line, character: Number.MAX_SAFE_INTEGER },
    });

    const trimmed = line.trimStart();
    if (trimmed.startsWith("#") || trimmed === "") return null;

    const eqIndex = line.indexOf("=");
    const keyPart = eqIndex >= 0 ? line.slice(0, eqIndex) : line;
    const key = keyPart.trim();
    if (!key) return null;

    const option = ghosttyConfigOptions.find((o) => o.key === key);
    if (!option) return null;

    return {
      contents: {
        kind: "markdown",
        value: `**${option.key}**\n\n${option.desc}\n\n[Documentation](https://ghostty.org/docs/config/reference#${option.key})`,
      },
    };
  });
}
