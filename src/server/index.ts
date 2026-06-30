import {
  createConnection,
  ProposedFeatures,
  TextDocumentSyncKind,
  TextDocuments,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { loadGhosttyActions } from "../lib/ghostty/actions";
import { loadGhosttyDefaults } from "../lib/ghostty/defaults";
import { loadGhosttyFonts } from "../lib/ghostty/fonts";
import { isGhosttyAvailable } from "../lib/ghostty/ghostty";
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

connection.onInitialized(async () => {
  const raw = await connection.workspace.getConfiguration("ghostty");
  const executablePath: string =
    (raw as { executablePath?: string })?.executablePath ?? "";
  const resolved = executablePath || undefined;

  if (!isGhosttyAvailable(resolved)) {
    const action = await connection.window.showWarningMessage(
      "Ghostty CLI not found. Install Ghostty or set `ghostty.executablePath`.",
      { title: "Install Ghostty" },
      { title: "Configure Path" },
    );
    if (action?.title === "Install Ghostty") {
      connection.window.showDocument({
        uri: "https://ghostty.org/",
        external: true,
      });
    } else if (action?.title === "Configure Path") {
      connection.sendNotification("ghostty/openSettings", {
        query: "ghostty.executablePath",
      });
    }
    return;
  }

  loadGhosttyDefaults(resolved);
  loadGhosttyFonts(resolved);
  loadGhosttyActions(resolved);
});

registerHoverProvider(connection, documents);
registerCompletionProvider(connection, documents);
registerDiagnosticsProvider(connection, documents);
registerFormatterProvider(connection, documents);
registerCodeActionProvider(connection, documents);
registerDocumentSymbolProvider(connection, documents);

documents.listen(connection);
connection.listen();
