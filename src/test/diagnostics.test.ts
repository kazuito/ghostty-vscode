import { describe, expect, it, vi } from "vitest";
import {
  type Diagnostic,
  DiagnosticSeverity,
} from "vscode-languageserver/node";
import { registerDiagnosticsProvider } from "../server/diagnostics";
import { createDocument, createMockConnection } from "./helpers";

function setupDiagnostics(content: string) {
  const doc = createDocument(content);
  const connection = createMockConnection();

  const handlers: {
    onDidOpen?: (e: { document: unknown }) => void;
    onDidChangeContent?: (e: { document: unknown }) => void;
    onDidClose?: (e: { document: unknown }) => void;
  } = {};

  const mockDocuments = {
    onDidOpen: vi.fn((cb: (e: { document: unknown }) => void) => {
      handlers.onDidOpen = cb;
    }),
    onDidChangeContent: vi.fn((cb: (e: { document: unknown }) => void) => {
      handlers.onDidChangeContent = cb;
    }),
    onDidClose: vi.fn((cb: (e: { document: unknown }) => void) => {
      handlers.onDidClose = cb;
    }),
  };

  registerDiagnosticsProvider(
    connection as never,
    mockDocuments as never,
  );

  const getDiagnostics = (): Diagnostic[] => {
    handlers.onDidOpen!({ document: doc });
    const calls = connection.sendDiagnostics.mock.calls;
    return (
      (calls[calls.length - 1]?.[0]?.diagnostics as Diagnostic[]) ?? []
    );
  };

  const getCloseDiagnostics = (): Diagnostic[] => {
    handlers.onDidClose!({ document: doc });
    const calls = connection.sendDiagnostics.mock.calls;
    return (
      (calls[calls.length - 1]?.[0]?.diagnostics as Diagnostic[]) ?? []
    );
  };

  return { getDiagnostics, getCloseDiagnostics };
}

describe("diagnostics provider - no diagnostics", () => {
  it("empty document produces no diagnostics", () => {
    const { getDiagnostics } = setupDiagnostics("");
    expect(getDiagnostics()).toHaveLength(0);
  });

  it("comment-only document produces no diagnostics", () => {
    const { getDiagnostics } = setupDiagnostics("# this is a comment");
    expect(getDiagnostics()).toHaveLength(0);
  });

  it("valid boolean value produces no diagnostics", () => {
    const { getDiagnostics } = setupDiagnostics("font-thicken = true");
    expect(getDiagnostics()).toHaveLength(0);
  });

  it("valid boolean false produces no diagnostics", () => {
    const { getDiagnostics } = setupDiagnostics("font-thicken = false");
    expect(getDiagnostics()).toHaveLength(0);
  });

  it("valid positive number produces no diagnostics", () => {
    const { getDiagnostics } = setupDiagnostics("font-size = 14");
    expect(getDiagnostics()).toHaveLength(0);
  });

  it("valid enum value produces no diagnostics", () => {
    const { getDiagnostics } = setupDiagnostics("alpha-blending = native");
    expect(getDiagnostics()).toHaveLength(0);
  });

  it("duplicate additive key produces no diagnostics", () => {
    const { getDiagnostics } = setupDiagnostics(
      "keybind = ctrl+a\nkeybind = ctrl+b",
    );
    expect(getDiagnostics()).toHaveLength(0);
  });

  it("valid number within min/max range produces no diagnostics", () => {
    // font-thicken-strength: z.number().int().min(0).max(255)
    const { getDiagnostics } = setupDiagnostics("font-thicken-strength = 128");
    expect(getDiagnostics()).toHaveLength(0);
  });
});

describe("diagnostics provider - unknown key", () => {
  it("produces a warning diagnostic for unknown key", () => {
    const { getDiagnostics } = setupDiagnostics("not-a-real-key = value");
    const diags = getDiagnostics();
    const warning = diags.find(
      (d) => d.severity === DiagnosticSeverity.Warning,
    );
    expect(warning).toBeDefined();
  });

  it("warning message contains the unknown key name", () => {
    const { getDiagnostics } = setupDiagnostics("not-a-real-key = value");
    const diags = getDiagnostics();
    const warning = diags.find(
      (d) => d.severity === DiagnosticSeverity.Warning,
    );
    expect(warning?.message).toContain("not-a-real-key");
  });

  it("unknown key range points to the key on its line", () => {
    const { getDiagnostics } = setupDiagnostics("not-a-real-key = value");
    const diags = getDiagnostics();
    const warning = diags.find(
      (d) => d.severity === DiagnosticSeverity.Warning,
    );
    expect(warning?.range.start.line).toBe(0);
    expect(warning?.range.start.character).toBe(0);
    expect(warning?.range.end.character).toBe("not-a-real-key".length);
  });
});

describe("diagnostics provider - duplicate key", () => {
  it("produces an information diagnostic for duplicate non-additive key", () => {
    const { getDiagnostics } = setupDiagnostics(
      "font-size = 12\nfont-size = 14",
    );
    const diags = getDiagnostics();
    const info = diags.find(
      (d) => d.severity === DiagnosticSeverity.Information,
    );
    expect(info).toBeDefined();
  });

  it("duplicate message includes key name and first-seen line number", () => {
    const { getDiagnostics } = setupDiagnostics(
      "font-size = 12\nfont-size = 14",
    );
    const diags = getDiagnostics();
    const info = diags.find(
      (d) => d.severity === DiagnosticSeverity.Information,
    );
    expect(info?.message).toContain("font-size");
    expect(info?.message).toContain("line 1");
  });

  it("duplicate diagnostic is on the second occurrence line", () => {
    const { getDiagnostics } = setupDiagnostics(
      "font-size = 12\nfont-size = 14",
    );
    const diags = getDiagnostics();
    const info = diags.find(
      (d) => d.severity === DiagnosticSeverity.Information,
    );
    expect(info?.range.start.line).toBe(1);
  });
});

describe("diagnostics provider - value validation", () => {
  it("invalid boolean value produces an error", () => {
    const { getDiagnostics } = setupDiagnostics("font-thicken = notabool");
    const diags = getDiagnostics();
    const error = diags.find((d) => d.severity === DiagnosticSeverity.Error);
    expect(error).toBeDefined();
  });

  it("boolean error message mentions true and false", () => {
    const { getDiagnostics } = setupDiagnostics("font-thicken = notabool");
    const diags = getDiagnostics();
    const error = diags.find((d) => d.severity === DiagnosticSeverity.Error);
    expect(error?.message).toContain("true");
    expect(error?.message).toContain("false");
  });

  it("invalid enum value produces an error", () => {
    const { getDiagnostics } = setupDiagnostics(
      "alpha-blending = bad-value",
    );
    const diags = getDiagnostics();
    const error = diags.find((d) => d.severity === DiagnosticSeverity.Error);
    expect(error).toBeDefined();
  });

  it("enum error message lists valid values", () => {
    const { getDiagnostics } = setupDiagnostics(
      "alpha-blending = bad-value",
    );
    const diags = getDiagnostics();
    const error = diags.find((d) => d.severity === DiagnosticSeverity.Error);
    expect(error?.message).toContain("native");
  });

  it("non-numeric value for number key produces an error", () => {
    const { getDiagnostics } = setupDiagnostics("font-size = abc");
    const diags = getDiagnostics();
    const error = diags.find((d) => d.severity === DiagnosticSeverity.Error);
    expect(error).toBeDefined();
  });

  it("number below minimum produces an error", () => {
    // font-thicken-strength: z.number().int().min(0).max(255)
    const { getDiagnostics } = setupDiagnostics(
      "font-thicken-strength = -1",
    );
    const diags = getDiagnostics();
    const error = diags.find((d) => d.severity === DiagnosticSeverity.Error);
    expect(error).toBeDefined();
  });

  it("number above maximum produces an error", () => {
    const { getDiagnostics } = setupDiagnostics(
      "font-thicken-strength = 256",
    );
    const diags = getDiagnostics();
    const error = diags.find((d) => d.severity === DiagnosticSeverity.Error);
    expect(error).toBeDefined();
  });

  it("accepts the corrected valid values for the reported Ghostty keys", () => {
    const lines = [
      "scrollbar = never",
      "window-subtitle = working-directory",
      "quick-terminal-animation-duration = 0.18",
      "app-notifications = clipboard-copy, config-reload",
      "macos-hidden = never",
      "macos-applescript = true",
      "gtk-tabs-location = top",
    ];
    const { getDiagnostics } = setupDiagnostics(lines.join("\n"));
    const errors = getDiagnostics().filter(
      (d) => d.severity === DiagnosticSeverity.Error,
    );
    expect(errors).toHaveLength(0);
  });

  it("rejects the runtime-invalid values reported by Ghostty", () => {
    const lines = [
      "scrollbar = always",
      "window-subtitle = schema stress profile",
      "quick-terminal-animation-duration = 180ms",
      "app-notifications = clipboard-paste",
      "macos-hidden = false",
      "macos-applescript = allow",
      "gtk-tabs-location = left",
    ];
    const { getDiagnostics } = setupDiagnostics(lines.join("\n"));
    const errors = getDiagnostics().filter(
      (d) => d.severity === DiagnosticSeverity.Error,
    );
    expect(errors).toHaveLength(lines.length);
  });
});

describe("diagnostics provider - document close", () => {
  it("closing a document clears its diagnostics", () => {
    const { getDiagnostics, getCloseDiagnostics } = setupDiagnostics(
      "not-a-real-key = value",
    );
    expect(getDiagnostics().length).toBeGreaterThan(0);
    expect(getCloseDiagnostics()).toHaveLength(0);
  });
});

describe("diagnostics provider - mixed document", () => {
  it("handles multiple issues in one document", () => {
    const content = [
      "# valid comment",
      "font-size = 14", // valid
      "not-a-key = value", // unknown key → warning
      "font-thicken = bad", // invalid boolean → error
      "font-size = 16", // duplicate → info
    ].join("\n");

    const { getDiagnostics } = setupDiagnostics(content);
    const diags = getDiagnostics();

    const warnings = diags.filter(
      (d) => d.severity === DiagnosticSeverity.Warning,
    );
    const errors = diags.filter(
      (d) => d.severity === DiagnosticSeverity.Error,
    );
    const infos = diags.filter(
      (d) => d.severity === DiagnosticSeverity.Information,
    );

    expect(warnings).toHaveLength(1);
    expect(errors).toHaveLength(1);
    expect(infos).toHaveLength(1);
  });
});
