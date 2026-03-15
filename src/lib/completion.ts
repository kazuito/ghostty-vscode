import { ghosttyDefaults } from "./defaults";
import { parseDocument } from "./document";
import { additiveKeys, ghosttyConfigOptions, optionByKey } from "./schema";

export interface CompletionSuggestion {
  label: string;
  kind: "property" | "value";
  detail?: string;
  replacementStart: number;
  replacementEnd: number;
  insertText: string;
}

export function getCompletionSuggestions(
  documentText: string,
  lineUpToCursor: string,
  cursorCharacter: number,
): CompletionSuggestion[] | null {
  if (lineUpToCursor.trimStart().startsWith("#")) return null;

  const eqIndex = lineUpToCursor.indexOf("=");

  if (eqIndex >= 0) {
    const key = lineUpToCursor.slice(0, eqIndex).trim();
    const option = optionByKey.get(key);
    if (!option) return null;

    const values = option.enum?.map(String) ?? [];
    if (values.length === 0) return null;

    const afterEq = lineUpToCursor.slice(eqIndex + 1);
    const valuePrefix = option.comma
      ? (afterEq.slice(afterEq.lastIndexOf(",") + 1) || afterEq).trimStart()
      : afterEq.trimStart();

    const replacementStart = cursorCharacter - valuePrefix.length;
    const defaultVal = ghosttyDefaults.get(key);

    return values
      .filter((value) => value.startsWith(valuePrefix))
      .map((value) => ({
        label: value,
        kind: "value" as const,
        detail:
          defaultVal !== undefined && value === defaultVal
            ? "default"
            : undefined,
        replacementStart,
        replacementEnd: cursorCharacter,
        insertText: value,
      }));
  }

  const usedKeys = new Set(
    parseDocument(documentText).flatMap((line) => {
      if (line.type === "entry") return [line.key];
      if (line.type === "unknown") {
        const key = line.raw.trim();
        return key ? [key] : [];
      }
      return [];
    }),
  );

  const prefix = lineUpToCursor.trim();
  const replacementStart = lineUpToCursor.length - prefix.length;

  return ghosttyConfigOptions
    .filter(
      (option) =>
        additiveKeys.has(option.key) ||
        !usedKeys.has(option.key) ||
        option.key === prefix,
    )
    .filter((option) => option.key.startsWith(prefix))
    .map((option) => {
      const defaultVal = ghosttyDefaults.get(option.key);
      const detail =
        defaultVal !== undefined && defaultVal !== ""
          ? `${option.desc} (default: ${defaultVal})`
          : option.desc;
      return {
        label: option.key,
        kind: "property" as const,
        detail,
        replacementStart,
        replacementEnd: cursorCharacter,
        insertText: `${option.key} = `,
      };
    });
}
