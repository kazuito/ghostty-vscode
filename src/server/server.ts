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
import type { ZodTypeAny } from "zod";
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

function extractValues(schema: ZodTypeAny): string[] | null {
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
			for (const opt of def.options as ZodTypeAny[]) {
				const vals = extractValues(opt);
				if (vals) results.push(...vals);
			}
			return results.length > 0 ? results : null;
		}
		default:
			return null;
	}
}

connection.onCompletion(
	(params: TextDocumentPositionParams): CompletionList | null => {
		const doc = documents.get(params.textDocument.uri);
		if (!doc) return null;

		const lineUpToCursor = doc.getText({
			start: { line: params.position.line, character: 0 },
			end: { line: params.position.line, character: params.position.character },
		});

		// Skip comment lines
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
				.map((v) => ({
					label: v,
					kind: CompletionItemKind.Value,
				}));

			return { isIncomplete: false, items };
		}

		// --- Key completion (cursor is before '=') ---
		const usedKeys = new Set<string>();
		const allText = doc.getText();
		for (const l of allText.split("\n")) {
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

documents.listen(connection);
connection.listen();
