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
  applyFonts(runGhosttySync(["+list-fonts"], executablePath));
}

export async function loadGhosttyFontsAsync(
  executablePath?: string,
  run: GhosttyRunner = runGhosttyAsync,
): Promise<void> {
  applyFonts(await run(["+list-fonts"], executablePath));
}
