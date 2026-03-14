import { parseDocument, type Range } from "./document";

export interface SymbolDescriptor {
  name: string;
  kind: "property";
  range: Range;
  selectionRange: Range;
}

export function getDocumentSymbols(text: string): SymbolDescriptor[] {
  return parseDocument(text).flatMap((line) => {
    if (line.type === "entry") {
      return [
        {
          name: line.key,
          kind: "property" as const,
          range: line.lineRange,
          selectionRange: line.keyRange,
        },
      ];
    }

    if (line.type !== "unknown") return [];

    const key = line.raw.trim();
    if (!key) return [];

    const keyStart = line.raw.indexOf(key);
    return [
      {
        name: key,
        kind: "property" as const,
        range: line.lineRange,
        selectionRange: {
          start: { line: line.line, character: keyStart },
          end: { line: line.line, character: keyStart + key.length },
        },
      },
    ];
  });
}
