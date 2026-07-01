import { GHOSTTY_CONFIG_REFERENCE_URL } from "../../core/constants";
import { parseLine } from "../../core/document";
import { optionByKey } from "../../core/schema";
import { ghosttyDefaults } from "../../ghostty/defaults";

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

  const defaultVal = ghosttyDefaults.get(key);
  const defaultLine =
    defaultVal !== undefined
      ? `\n\n**Default:** ${defaultVal === "" ? "*(empty)*" : `\`${defaultVal}\``}`
      : "";

  return {
    kind: "markdown",
    value: `**${option.key}**\n\n${option.desc}${defaultLine}\n\n[Documentation](${GHOSTTY_CONFIG_REFERENCE_URL}${option.key})`,
  };
}
