import { execFileSync } from "node:child_process";

/**
 * PATH augmented with the macOS app bundle location so `ghostty` is found
 * even when the extension host doesn't inherit the user's shell PATH.
 */
export const ghosttyPathEnv =
  process.platform === "darwin"
    ? `${process.env.PATH ?? ""}:/Applications/Ghostty.app/Contents/MacOS`
    : process.env.PATH;

export function ghosttyBin(executablePath?: string): string {
  return executablePath || "ghostty";
}

export function ghosttyEnv(executablePath?: string): NodeJS.ProcessEnv {
  return executablePath
    ? { ...process.env }
    : { ...process.env, PATH: ghosttyPathEnv };
}

/**
 * Run a ghostty command synchronously and return stdout.
 * Returns an empty string if ghostty is not found or the command fails.
 */
export function runGhosttySync(
  args: string[],
  executablePath?: string,
): string {
  try {
    return execFileSync(ghosttyBin(executablePath), args, {
      encoding: "utf8",
      timeout: 5000,
      env: ghosttyEnv(executablePath),
    });
  } catch {
    return "";
  }
}

/**
 * Returns true if the ghostty binary is reachable and exits successfully.
 */
export function isGhosttyAvailable(executablePath?: string): boolean {
  return runGhosttySync(["--version"], executablePath) !== "";
}
