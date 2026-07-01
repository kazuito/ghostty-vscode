import { execFile } from "node:child_process";
import { GHOSTTY_CLI_TIMEOUT_MS } from "./constants";

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

export type GhosttyRunner = (
  args: string[],
  executablePath?: string,
) => Promise<string>;

/**
 * Run a ghostty command asynchronously and return stdout.
 * Returns an empty string if ghostty is not found or the command fails.
 */
export const runGhosttyAsync: GhosttyRunner = (args, executablePath?) =>
  new Promise<string>((resolve) => {
    execFile(
      ghosttyBin(executablePath),
      args,
      {
        encoding: "utf8",
        timeout: GHOSTTY_CLI_TIMEOUT_MS,
        env: ghosttyEnv(executablePath),
      },
      (err, stdout) => {
        resolve(err ? "" : stdout);
      },
    );
  });

/**
 * Returns true if the ghostty binary is reachable and exits successfully.
 */
export async function isGhosttyAvailableAsync(
  executablePath?: string,
  run: GhosttyRunner = runGhosttyAsync,
): Promise<boolean> {
  return (await run(["--version"], executablePath)) !== "";
}
