import {
  createConnection,
  ProposedFeatures,
  TextDocumentSyncKind,
  TextDocuments,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { reloadGhosttyData } from "../lib/ghostty/reload";
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

async function promptGhosttyNotFound(): Promise<void> {
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
}

let reloadToken = 0;
let lastExecutablePath: string | undefined;

async function refreshGhosttyData(force = false): Promise<void> {
  const raw = await connection.workspace.getConfiguration("ghostty");
  const executablePath: string =
    (raw as { executablePath?: string })?.executablePath ?? "";

  if (!force && executablePath === lastExecutablePath) return;
  lastExecutablePath = executablePath;

  const token = ++reloadToken;
  try {
    const available = await reloadGhosttyData(executablePath || undefined);
    if (token !== reloadToken) return;
    if (!available) await promptGhosttyNotFound();
  } catch (error) {
    connection.console.error(
      `Ghostty data reload failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

connection.onInitialized(() => {
  void refreshGhosttyData(true);
});

connection.onDidChangeConfiguration(() => {
  void refreshGhosttyData();
});

registerHoverProvider(connection, documents);
registerCompletionProvider(connection, documents);
registerDiagnosticsProvider(connection, documents);
registerFormatterProvider(connection, documents);
registerCodeActionProvider(connection, documents);
registerDocumentSymbolProvider(connection, documents);

documents.listen(connection);
connection.listen();
