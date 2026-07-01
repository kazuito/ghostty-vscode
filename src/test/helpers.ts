import { vi } from "vitest";
import { TextDocument } from "vscode-languageserver-textdocument";

export function createDocument(content: string): TextDocument {
  return TextDocument.create(
    "file:///test.ghostty",
    "ghostty-config",
    1,
    content,
  );
}

export function createMockConnection() {
  return {
    onHover: vi.fn(),
    onCompletion: vi.fn(),
    onCodeAction: vi.fn(),
    onDocumentSymbol: vi.fn(),
    onDocumentFormatting: vi.fn(),
    sendDiagnostics: vi.fn(),
    workspace: {
      getConfiguration: vi.fn().mockResolvedValue(undefined),
    },
    console: {
      error: vi.fn(),
      warn: vi.fn(),
    },
    window: {
      showErrorMessage: vi.fn(),
    },
  };
}

export function createMockDocuments(doc: TextDocument) {
  return {
    get: vi.fn(() => doc),
    onDidOpen: vi.fn(),
    onDidChangeContent: vi.fn(),
    onDidClose: vi.fn(),
  };
}
