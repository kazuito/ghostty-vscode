import { parseLine } from "./document";
import { optionByKey } from "./schema";

export interface HoverContent {
  kind: "markdown";
  value: string;
}

export function getHoverContent(line: string): HoverContent | null {
  const parsed = parseLine(line);
  if (parsed.type !== "entry" && parsed.type !== "unknown") return null;

  const key = parsed.type === "entry" ? parsed.key : parsed.raw.trim();
  if (!key) return null;

  const option = optionByKey.get(key);
  if (!option) return null;

  const defaultLine =
    option.default !== undefined
      ? `\n\n**Default:** \`${option.default}\``
      : "";

  return {
    kind: "markdown",
    value: `**${option.key}**\n\n${option.desc}${defaultLine}\n\n[Documentation](https://ghostty.org/docs/config/reference#${option.key})`,
  };
}
