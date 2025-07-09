import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  DocumentDiagnosticReportKind,
  type DocumentDiagnosticReport,
  Hover,
  MarkupKind
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { parseGhosttyConfig } from './parser';
import { getCompletionItems } from './completion';
import { getHoverInfo } from './hover';
import { getDiagnostics } from './diagnostics';

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['=', ' ', '\t']
      },
      // Tell the client that this server supports hover
      hoverProvider: true,
      // Tell the client that this server supports diagnostics
      diagnosticProvider: {
        interFileDependencies: false,
        workspaceDiagnostics: false
      }
    }
  };

  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true
      }
    };
  }

  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(_event => {
      connection.console.log('Workspace folder change event received.');
    });
  }
});

// The global settings, used when the `workspace/configuration` request is not supported by the client
interface GhosttySettings {
  maxNumberOfProblems: number;
}

// The default settings
const defaultSettings: GhosttySettings = { maxNumberOfProblems: 1000 };
let globalSettings: GhosttySettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<GhosttySettings>> = new Map();

connection.onDidChangeConfiguration(change => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = <GhosttySettings>(
      (change.settings.languageServerGhostty || defaultSettings)
    );
  }
  // Refresh the diagnostics since the `maxNumberOfProblems` could have changed
  connection.languages.diagnostics.refresh();
});

function getDocumentSettings(resource: string): Thenable<GhosttySettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: 'languageServerGhostty'
    }).then(config => config || defaultSettings);
    documentSettings.set(resource, result);
  }
  return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
  documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document is first opened or when its content has changed.
documents.onDidChangeContent(change => {
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const settings = await getDocumentSettings(textDocument.uri);
  const text = textDocument.getText();
  const maxProblems = settings?.maxNumberOfProblems ?? defaultSettings.maxNumberOfProblems;
  const diagnostics = getDiagnostics(text, maxProblems);
  
  // Send the computed diagnostics to VSCode
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// Handle completion requests
connection.onCompletion(
  (textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    const document = documents.get(textDocumentPosition.textDocument.uri);
    if (!document) {
      return [];
    }

    const text = document.getText();
    const position = textDocumentPosition.position;
    const offset = document.offsetAt(position);

    return getCompletionItems(text, offset, position);
  }
);

// Handle completion item resolve requests
connection.onCompletionResolve(
  (item: CompletionItem): CompletionItem => {
    // For now, just return the item as-is
    // In the future, we could add more detailed documentation here
    return item;
  }
);

// Handle hover requests
connection.onHover(
  (textDocumentPosition: TextDocumentPositionParams): Hover | undefined => {
    const document = documents.get(textDocumentPosition.textDocument.uri);
    if (!document) {
      return undefined;
    }

    const text = document.getText();
    const position = textDocumentPosition.position;
    const offset = document.offsetAt(position);

    return getHoverInfo(text, offset, position);
  }
);

// Handle diagnostic requests
connection.languages.diagnostics.on(async (params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return {
      kind: DocumentDiagnosticReportKind.Full,
      items: []
    } satisfies DocumentDiagnosticReport;
  }

  const settings = await getDocumentSettings(params.textDocument.uri);
  const text = document.getText();
  const maxProblems = settings?.maxNumberOfProblems ?? defaultSettings.maxNumberOfProblems;
  const diagnostics = getDiagnostics(text, maxProblems);

  return {
    kind: DocumentDiagnosticReportKind.Full,
    items: diagnostics
  } satisfies DocumentDiagnosticReport;
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

// Log that the server is starting
connection.console.log('Ghostty Language Server started');