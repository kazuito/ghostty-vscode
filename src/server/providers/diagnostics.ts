import {
  type Connection,
  Diagnostic,
  DiagnosticSeverity,
  type TextDocuments,
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import {
  parseGhosttyOutput,
  runGhosttyValidation,
  type ValidationDiagnostic,
  validateInProcess,
} from "../../lib/diagnostics";

function toLspSeverity(
  severity: ValidationDiagnostic["severity"],
): DiagnosticSeverity {
  switch (severity) {
    case "warning":
      return DiagnosticSeverity.Warning;
    case "information":
      return DiagnosticSeverity.Information;
    case "error":
      return DiagnosticSeverity.Error;
  }
}

function toLspDiagnostic(diagnostic: ValidationDiagnostic): Diagnostic {
  return Diagnostic.create(
    diagnostic.range,
    diagnostic.message,
    toLspSeverity(diagnostic.severity),
  );
}

async function validateDocumentAsync(
  connection: Connection,
  doc: TextDocument,
  token: { cancelled: boolean },
  inProcessDiags: Diagnostic[],
  lastCliDiags: Map<string, Diagnostic[]>,
): Promise<void> {
  const raw = await connection.workspace.getConfiguration({
    scopeUri: doc.uri,
    section: "ghostty",
  });
  const executablePath: string =
    (raw as { executablePath?: string })?.executablePath ?? "";
  const output = await runGhosttyValidation(doc.getText(), executablePath);
  if (token.cancelled) return;

  const lines = doc.getText().split("\n");
  const cliDiags = parseGhosttyOutput(output, lines).map(toLspDiagnostic);
  lastCliDiags.set(doc.uri, cliDiags);

  connection.sendDiagnostics({
    uri: doc.uri,
    diagnostics: [...inProcessDiags, ...cliDiags],
  });
}

export function registerDiagnosticsProvider(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
): void {
  const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const validationTokens = new Map<string, { cancelled: boolean }>();
  const lastCliDiags = new Map<string, Diagnostic[]>();

  function scheduleValidation(doc: TextDocument): void {
    const uri = doc.uri;
    const inProcessDiags = validateInProcess(doc.getText()).map(
      toLspDiagnostic,
    );

    connection.sendDiagnostics({
      uri,
      diagnostics: [...inProcessDiags, ...(lastCliDiags.get(uri) ?? [])],
    });

    clearTimeout(debounceTimers.get(uri));
    const prevToken = validationTokens.get(uri);
    if (prevToken) prevToken.cancelled = true;

    const token = { cancelled: false };
    validationTokens.set(uri, token);
    debounceTimers.set(
      uri,
      setTimeout(() => {
        debounceTimers.delete(uri);
        void validateDocumentAsync(
          connection,
          doc,
          token,
          inProcessDiags,
          lastCliDiags,
        );
      }, 100),
    );
  }

  documents.onDidOpen((e) => scheduleValidation(e.document));
  documents.onDidChangeContent((e) => scheduleValidation(e.document));
  documents.onDidClose((e) => {
    const uri = e.document.uri;
    clearTimeout(debounceTimers.get(uri));
    debounceTimers.delete(uri);
    const token = validationTokens.get(uri);
    if (token) token.cancelled = true;
    validationTokens.delete(uri);
    lastCliDiags.delete(uri);
    connection.sendDiagnostics({ uri, diagnostics: [] });
  });
}
