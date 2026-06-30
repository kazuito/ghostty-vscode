export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export type ParsedLine =
  | { type: "blank" }
  | { type: "comment"; raw: string }
  | {
      type: "entry";
      key: string;
      /** Raw value string — everything after "=" without trimming. */
      rawValue: string;
      raw: string;
      eqIndex: number;
    }
  | { type: "unknown"; raw: string };

export type ParsedDocumentLine =
  | {
      type: "blank";
      line: number;
      raw: string;
      lineRange: Range;
    }
  | {
      type: "comment";
      line: number;
      raw: string;
      lineRange: Range;
    }
  | {
      type: "unknown";
      line: number;
      raw: string;
      lineRange: Range;
    }
  | {
      type: "entry";
      line: number;
      raw: string;
      key: string;
      rawValue: string;
      eqIndex: number;
      lineRange: Range;
      keyRange: Range;
      valueRange: Range | null;
    };

export function parseLine(raw: string): ParsedLine {
  const trimmed = raw.trimStart();
  if (trimmed === "") return { type: "blank" };
  if (trimmed.startsWith("#")) return { type: "comment", raw };

  const eqIndex = raw.indexOf("=");
  if (eqIndex < 0) return { type: "unknown", raw };

  const key = raw.slice(0, eqIndex).trim();
  if (!key) return { type: "unknown", raw };

  return { type: "entry", key, rawValue: raw.slice(eqIndex + 1), raw, eqIndex };
}

export function parseDocumentLine(
  raw: string,
  line: number,
): ParsedDocumentLine {
  const parsed = parseLine(raw);
  const lineRange = {
    start: { line, character: 0 },
    end: { line, character: raw.length },
  };

  if (parsed.type !== "entry") {
    return { ...parsed, line, raw, lineRange };
  }

  const keyStart = raw.indexOf(parsed.key);
  const value = raw.slice(parsed.eqIndex + 1).trim();
  const valueStart = value
    ? raw.indexOf(value, parsed.eqIndex + 1)
    : parsed.eqIndex + 1;

  return {
    ...parsed,
    line,
    lineRange,
    keyRange: {
      start: { line, character: keyStart },
      end: { line, character: keyStart + parsed.key.length },
    },
    valueRange: {
      start: { line, character: valueStart },
      end: { line, character: value ? valueStart + value.length : valueStart },
    },
  };
}

export function parseDocument(text: string): ParsedDocumentLine[] {
  return text.split("\n").map((raw, line) => parseDocumentLine(raw, line));
}
