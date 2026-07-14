import { type Mock, vi } from "vitest";
import { TextDocument } from "vscode-languageserver-textdocument";

export function createDocument(content: string): TextDocument {
  return TextDocument.create(
    "file:///test.ghostty",
    "ghostty-config",
    1,
    content,
  );
}

export function createMockConnection(): {
  onHover: Mock;
  onCompletion: Mock;
  onCodeAction: Mock;
  onDocumentSymbol: Mock;
  onDocumentFormatting: Mock;
  sendDiagnostics: Mock;
  workspace: { getConfiguration: Mock };
  console: { error: Mock; warn: Mock };
  window: { showErrorMessage: Mock };
} {
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

export function createMockDocuments(doc: TextDocument): {
  get: Mock<(uri: string) => TextDocument | undefined>;
  onDidOpen: Mock;
  onDidChangeContent: Mock;
  onDidClose: Mock;
} {
  return {
    get: vi.fn((_uri: string): TextDocument | undefined => doc),
    onDidOpen: vi.fn(),
    onDidChangeContent: vi.fn(),
    onDidClose: vi.fn(),
  };
}
