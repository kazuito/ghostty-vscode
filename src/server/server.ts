import {
	CompletionItemKind,
	type CompletionList,
	createConnection,
	type Hover,
	ProposedFeatures,
	type TextDocumentPositionParams,
	TextDocumentSyncKind,
	TextDocuments,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { additiveKeys, ghosttyConfigOptions } from "../shared/schema";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

connection.onInitialize(() => ({
	capabilities: {
		textDocumentSync: TextDocumentSyncKind.Incremental,
		hoverProvider: true,
		completionProvider: { triggerCharacters: [] },
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

connection.onCompletion((params: TextDocumentPositionParams): CompletionList | null => {
	const doc = documents.get(params.textDocument.uri);
	if (!doc) return null;

	// Only complete on lines that have no '=' yet (i.e. user is typing the key)
	const line = doc.getText({
		start: { line: params.position.line, character: 0 },
		end: { line: params.position.line, character: params.position.character },
	});
	if (line.includes("=")) return null;

	// Skip comment lines
	if (line.trimStart().startsWith("#")) return null;

	// Collect keys already used in the document (one per line before '=')
	const usedKeys = new Set<string>();
	const allText = doc.getText();
	for (const l of allText.split("\n")) {
		const t = l.trimStart();
		if (t.startsWith("#") || t === "") continue;
		const eq = l.indexOf("=");
		const k = (eq >= 0 ? l.slice(0, eq) : l).trim();
		if (k) usedKeys.add(k);
	}

	const prefix = line.trim();

	const items = ghosttyConfigOptions
		.filter((o) => additiveKeys.has(o.key) || !usedKeys.has(o.key) || o.key === prefix)
		.filter((o) => o.key.startsWith(prefix))
		.map((o) => ({
			label: o.key,
			kind: CompletionItemKind.Property,
			detail: o.desc,
			insertText: `${o.key} = `,
		}));

	return { isIncomplete: false, items };
});

documents.listen(connection);
connection.listen();
