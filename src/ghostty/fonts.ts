import { GHOSTTY_CLI_FLAGS } from "./constants";
import { type GhosttyRunner, runGhosttyAsync, runGhosttySync } from "./ghostty";

export const ghosttyFonts: string[] = [];

export function parseFontsOutput(output: string): string[] {
  const fonts: string[] = [];
  for (const line of output.split("\n")) {
    if (line && !line.startsWith(" ")) {
      fonts.push(line.trim());
    }
  }
  return fonts;
}

function applyFonts(output: string): void {
  ghosttyFonts.length = 0;
  ghosttyFonts.push(...parseFontsOutput(output));
}

export function loadGhosttyFonts(executablePath?: string): void {
  applyFonts(runGhosttySync([GHOSTTY_CLI_FLAGS.LIST_FONTS], executablePath));
}

export async function loadGhosttyFontsAsync(
  executablePath?: string,
  run: GhosttyRunner = runGhosttyAsync,
): Promise<void> {
  applyFonts(await run([GHOSTTY_CLI_FLAGS.LIST_FONTS], executablePath));
}
