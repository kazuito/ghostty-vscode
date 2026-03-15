import { runGhosttySync } from "./ghostty";

export const ghosttyFonts: string[] = [];

export function loadGhosttyFonts(executablePath?: string): void {
  ghosttyFonts.length = 0;
  const output = runGhosttySync(["+list-fonts"], executablePath);
  for (const line of output.split("\n")) {
    if (line && !line.startsWith(" ")) {
      ghosttyFonts.push(line.trim());
    }
  }
}
