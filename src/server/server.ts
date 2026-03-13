import {
	createConnection,
	type Hover,
	ProposedFeatures,
	type TextDocumentPositionParams,
	TextDocumentSyncKind,
	TextDocuments,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ghosttyConfigOptions } from "../shared/schema";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

connection.onInitialize(() => ({
	capabilities: {
		textDocumentSync: TextDocumentSyncKind.Incremental,
		hoverProvider: true,
	},
}));

connection.onHover((params: TextDocumentPositionParams): Hover | null => {
	const doc = documents.get(params.textDocument.uri);
	if (!doc) return null;

	const line = doc.getText({
		start: { line: params.position.line, character: 0 },
		end: { line: params.position.line, character: Number.MAX_SAFE_INTEGER },
	});

	// Skip comments and blank lines
	const trimmed = line.trimStart();
	if (trimmed.startsWith("#") || trimmed === "") return null;

	// Extract the key (everything before '=' or end of line, trimmed)
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

documents.listen(connection);
connection.listen();
