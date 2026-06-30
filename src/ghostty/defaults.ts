import { type GhosttyRunner, runGhosttyAsync, runGhosttySync } from "./ghostty";

export const ghosttyDefaults: Map<string, string> = new Map();

export function parseDefaultsOutput(output: string): Map<string, string> {
  const defaults = new Map<string, string>();

  for (const line of output.split("\n")) {
    const eqIndex = line.indexOf(" = ");

    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 3).trim();

    if (key) defaults.set(key, value);
  }

  return defaults;
}

function applyDefaults(output: string): void {
  ghosttyDefaults.clear();
  for (const [key, value] of parseDefaultsOutput(output)) {
    ghosttyDefaults.set(key, value);
  }
}

export function loadGhosttyDefaults(executablePath?: string): void {
  applyDefaults(runGhosttySync(["+show-config", "--default"], executablePath));
}

export async function loadGhosttyDefaultsAsync(
  executablePath?: string,
  run: GhosttyRunner = runGhosttyAsync,
): Promise<void> {
  applyDefaults(await run(["+show-config", "--default"], executablePath));
}
