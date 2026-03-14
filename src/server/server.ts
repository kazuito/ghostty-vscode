import {
  createConnection,
  ProposedFeatures,
  TextDocumentSyncKind,
  TextDocuments,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { registerCodeActionProvider } from "./codeActions";
import { registerCompletionProvider } from "./completion";
import { registerDiagnosticsProvider } from "./diagnostics";
import { registerDocumentSymbolProvider } from "./documentSymbols";
import { registerFormatterProvider } from "./formatter";
import { registerHoverProvider } from "./hover";

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
