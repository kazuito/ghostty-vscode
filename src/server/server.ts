import {
  createConnection,
  ProposedFeatures,
  TextDocumentSyncKind,
  TextDocuments,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { registerCompletionProvider } from "./completion";
import { registerDiagnosticsProvider } from "./diagnostics";
import { registerHoverProvider } from "./hover";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

connection.onInitialize(() => ({
  capabilities: {
    textDocumentSync: TextDocumentSyncKind.Incremental,
    hoverProvider: true,
    completionProvider: { triggerCharacters: [] },
  },
}));

registerHoverProvider(connection, documents);
registerCompletionProvider(connection, documents);
registerDiagnosticsProvider(connection, documents);

documents.listen(connection);
connection.listen();
