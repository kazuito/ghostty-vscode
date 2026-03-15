import { runGhosttySync } from "./ghostty";

export const ghosttyDefaults: Map<string, string> = new Map();

export function loadGhosttyDefaults(executablePath?: string): void {
  ghosttyDefaults.clear();
  const output = runGhosttySync(["+show-config", "--default"], executablePath);

  for (const line of output.split("\n")) {
    const eqIndex = line.indexOf(" = ");

    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 3).trim();

    if (key) ghosttyDefaults.set(key, value);
  }
}
