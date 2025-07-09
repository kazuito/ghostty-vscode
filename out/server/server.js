"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const completion_1 = require("./completion");
const hover_1 = require("./hover");
const diagnostics_1 = require("./diagnostics");
// Create a connection for the server
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
// Create a simple text document manager
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
connection.onInitialize((params) => {
    const capabilities = params.capabilities;
    // Does the client support the `workspace/configuration` request?
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    hasDiagnosticRelatedInformationCapability = !!(capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation);
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
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
        connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
});
// The default settings
const defaultSettings = { maxNumberOfProblems: 1000 };
let globalSettings = defaultSettings;
// Cache the settings of all open documents
const documentSettings = new Map();
connection.onDidChangeConfiguration(change => {
    if (hasConfigurationCapability) {
        // Reset all cached document settings
        documentSettings.clear();
    }
    else {
        globalSettings = ((change.settings.languageServerGhostty || defaultSettings));
    }
    // Refresh the diagnostics since the `maxNumberOfProblems` could have changed
    connection.languages.diagnostics.refresh();
});
function getDocumentSettings(resource) {
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
async function validateTextDocument(textDocument) {
    var _a;
    const settings = await getDocumentSettings(textDocument.uri);
    const text = textDocument.getText();
    const maxProblems = (_a = settings === null || settings === void 0 ? void 0 : settings.maxNumberOfProblems) !== null && _a !== void 0 ? _a : defaultSettings.maxNumberOfProblems;
    const diagnostics = (0, diagnostics_1.getDiagnostics)(text, maxProblems);
    // Send the computed diagnostics to VSCode
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}
// Handle completion requests
connection.onCompletion((textDocumentPosition) => {
    const document = documents.get(textDocumentPosition.textDocument.uri);
    if (!document) {
        return [];
    }
    const text = document.getText();
    const position = textDocumentPosition.position;
    const offset = document.offsetAt(position);
    return (0, completion_1.getCompletionItems)(text, offset, position);
});
// Handle completion item resolve requests
connection.onCompletionResolve((item) => {
    // For now, just return the item as-is
    // In the future, we could add more detailed documentation here
    return item;
});
// Handle hover requests
connection.onHover((textDocumentPosition) => {
    const document = documents.get(textDocumentPosition.textDocument.uri);
    if (!document) {
        return undefined;
    }
    const text = document.getText();
    const position = textDocumentPosition.position;
    const offset = document.offsetAt(position);
    return (0, hover_1.getHoverInfo)(text, offset, position);
});
// Handle diagnostic requests
connection.languages.diagnostics.on(async (params) => {
    var _a;
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return {
            kind: node_1.DocumentDiagnosticReportKind.Full,
            items: []
        };
    }
    const settings = await getDocumentSettings(params.textDocument.uri);
    const text = document.getText();
    const maxProblems = (_a = settings === null || settings === void 0 ? void 0 : settings.maxNumberOfProblems) !== null && _a !== void 0 ? _a : defaultSettings.maxNumberOfProblems;
    const diagnostics = (0, diagnostics_1.getDiagnostics)(text, maxProblems);
    return {
        kind: node_1.DocumentDiagnosticReportKind.Full,
        items: diagnostics
    };
});
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();
// Log that the server is starting
connection.console.log('Ghostty Language Server started');
//# sourceMappingURL=server.js.map