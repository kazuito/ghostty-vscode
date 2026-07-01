import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  GHOSTTY_CLI_FLAGS,
  GHOSTTY_CLI_TIMEOUT_MS,
  GHOSTTY_CONFIG_FILE_FLAG_PREFIX,
} from "../../ghostty/constants";
import { ghosttyBin, ghosttyEnv } from "../../ghostty/ghostty";
import type { ValidationResult } from "./types";

export function createValidationTempPath(): string {
  return join(tmpdir(), `ghostty-validate-${randomBytes(6).toString("hex")}`);
}

export async function runGhosttyValidation(
  content: string,
  executablePath: string,
  tmpPath?: string,
  signal?: AbortSignal,
): Promise<ValidationResult> {
  const validationTmpPath = tmpPath ?? createValidationTempPath();
  const bin = ghosttyBin(executablePath);
  const env = ghosttyEnv(executablePath);
  const shouldDeleteTempFile = tmpPath == null;

  try {
    await writeFile(validationTmpPath, content, "utf8");
    return await new Promise<ValidationResult>((resolve) => {
      execFile(
        bin,
        [
          GHOSTTY_CLI_FLAGS.VALIDATE_CONFIG,
          `${GHOSTTY_CONFIG_FILE_FLAG_PREFIX}${validationTmpPath}`,
        ],
        { timeout: GHOSTTY_CLI_TIMEOUT_MS, env, signal },
        (err, stdout, stderr) => {
          const reportedErrors =
            err != null && typeof (err as { code?: unknown }).code === "number";
          resolve({ output: `${stdout}\n${stderr}`, reportedErrors });
        },
      );
    });
  } catch {
    return { output: "", reportedErrors: false };
  } finally {
    if (shouldDeleteTempFile) {
      unlink(validationTmpPath).catch(() => {});
    }
  }
}
