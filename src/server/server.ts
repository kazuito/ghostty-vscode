import {
  createConnection,
  ProposedFeatures,
  TextDocumentSyncKind,
  TextDocuments,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { registerCodeActionProvider } from "./providers/codeActions";
import { registerCompletionProvider } from "./providers/completion";
import { registerDiagnosticsProvider } from "./providers/diagnostics";
import { registerDocumentSymbolProvider } from "./providers/documentSymbols";
import { registerFormatterProvider } from "./providers/formatter";
import { registerHoverProvider } from "./providers/hover";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

connection.onInitialize(() => ({
  capabilities: {
    textDocumentSync: TextDocumentSyncKind.Incremental,
    hoverProvider: true,
    completionProvider: { triggerCharacters: [] },
    documentFormattingProvider: true,
    codeActionProvider: true,
    documentSymbolProvider: true,
  },
}));

registerHoverProvider(connection, documents);
registerCompletionProvider(connection, documents);
registerDiagnosticsProvider(connection, documents);
registerFormatterProvider(connection, documents);
registerCodeActionProvider(connection, documents);
registerDocumentSymbolProvider(connection, documents);

documents.listen(connection);
connection.listen();
