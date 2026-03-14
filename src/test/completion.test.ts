import { describe, expect, it } from "vitest";
import type {
  CompletionList,
  TextDocumentPositionParams,
} from "vscode-languageserver/node";
import { registerCompletionProvider } from "../server/completion";
import {
  createDocument,
  createMockConnection,
  createMockDocuments,
} from "./helpers";

function setupCompletion(content: string) {
  const doc = createDocument(content);
  const connection = createMockConnection();
  const documents = createMockDocuments(doc);

  registerCompletionProvider(
    connection as never,
    documents as never,
  );

  const handler = connection.onCompletion.mock.calls[0][0] as (
    params: TextDocumentPositionParams,
  ) => CompletionList | null;

  return (line: number, character: number) =>
    handler({
      textDocument: { uri: "file:///test.ghostty" },
      position: { line, character },
    });
}

describe("completion provider - key completions", () => {
  it("returns null for comment line", () => {
    const complete = setupCompletion("# comment");
    expect(complete(0, 5)).toBeNull();
  });

  it("returns completions for empty document", () => {
    const complete = setupCompletion("");
    const result = complete(0, 0);
    expect(result).not.toBeNull();
    expect(result?.items.length).toBeGreaterThan(0);
  });

  it("returns all keys when no prefix is typed", () => {
    const complete = setupCompletion("");
    const result = complete(0, 0);
    // schema defines ~202 keys
    expect(result?.items.length).toBeGreaterThan(100);
  });

  it("filters keys by typed prefix", () => {
    const complete = setupCompletion("font-s");
    const result = complete(0, 6);
    expect(result).not.toBeNull();
    expect(result?.items.every((item) => item.label.startsWith("font-s"))).toBe(
      true,
    );
  });

  it("excludes already-used non-additive keys", () => {
    const complete = setupCompletion("font-size = 12\nfont-");
    const result = complete(1, 5);
    const labels = result?.items.map((i) => i.label) ?? [];
    expect(labels).not.toContain("font-size");
  });

  it("includes additive keys even when already used", () => {
    const complete = setupCompletion("keybind = ctrl+a\nkeyb");
    const result = complete(1, 4);
    const labels = result?.items.map((i) => i.label) ?? [];
    expect(labels).toContain("keybind");
  });

  it("key completion inserts key followed by equals sign", () => {
    const complete = setupCompletion("font-size");
    const result = complete(0, 9);
    const item = result?.items.find((i) => i.label === "font-size");
    expect(item).toBeDefined();
    expect((item?.textEdit as { newText: string }).newText).toBe("font-size = ");
  });

  it("key completion uses Property kind", () => {
    const complete = setupCompletion("font-");
    const result = complete(0, 5);
    // CompletionItemKind.Property = 10
    expect(result?.items.every((i) => i.kind === 10)).toBe(true);
  });
});

describe("completion provider - value completions", () => {
  it("returns true/false for a boolean key", () => {
    const complete = setupCompletion("font-thicken = ");
    const result = complete(0, 15);
    const labels = result?.items.map((i) => i.label) ?? [];
    expect(labels).toContain("true");
    expect(labels).toContain("false");
  });

  it("returns enum values for an enum key", () => {
    const complete = setupCompletion("alpha-blending = ");
    const result = complete(0, 17);
    const labels = result?.items.map((i) => i.label) ?? [];
    expect(labels).toContain("native");
    expect(labels).toContain("linear");
    expect(labels).toContain("linear-corrected");
  });

  it("filters value completions by typed prefix", () => {
    const complete = setupCompletion("alpha-blending = lin");
    const result = complete(0, 20);
    const labels = result?.items.map((i) => i.label) ?? [];
    expect(labels).toContain("linear");
    expect(labels).toContain("linear-corrected");
    expect(labels).not.toContain("native");
  });

  it("returns null for unknown key after equals", () => {
    const complete = setupCompletion("unknown-key = ");
    expect(complete(0, 14)).toBeNull();
  });

  it("returns null for number key (no enum completions)", () => {
    const complete = setupCompletion("font-size = ");
    expect(complete(0, 12)).toBeNull();
  });

  it("value completion textEdit replaces the value prefix", () => {
    const complete = setupCompletion("alpha-blending = nat");
    const result = complete(0, 20);
    const item = result?.items.find((i) => i.label === "native");
    expect(item).toBeDefined();
    expect((item?.textEdit as { newText: string }).newText).toBe("native");
  });
});
