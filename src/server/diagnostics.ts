import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type Connection,
  Diagnostic,
  DiagnosticSeverity,
  type TextDocuments,
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { additiveKeys, ghosttyConfigOptions } from "../shared/schema";

const validKeys = new Set<string>(ghosttyConfigOptions.map((o) => o.key));

// On macOS, Ghostty ships as an app bundle and may not be on the default PATH.
const GHOSTTY_PATH_ENV =
  process.platform === "darwin"
    ? `${process.env.PATH ?? ""}:/Applications/Ghostty.app/Contents/MacOS`
    : process.env.PATH;

async function runGhosttyValidation(content: string): Promise<string> {
  const tmpPath = join(
    tmpdir(),
    `ghostty-validate-${randomBytes(6).toString("hex")}`,
  );
  try {
    await writeFile(tmpPath, content, "utf8");
    return await new Promise<string>((resolve) => {
      execFile(
        "ghostty",
        ["+validate-config", `--config-file=${tmpPath}`],
        { timeout: 5000, env: { ...process.env, PATH: GHOSTTY_PATH_ENV } },
        (_err, stdout, stderr) => {
          resolve(`${stdout}\n${stderr}`);
        },
      );
    });
  } catch {
    return "";
  } finally {
    unlink(tmpPath).catch(() => {});
  }
}

export function parseGhosttyOutput(
  output: string,
  lines: string[],
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  // Match: <path>:<linenum>:<key>: <message>
  const lineRegex = /^.+?:(\d+):([^:]+):\s*(.+)$/;

  for (const rawLine of output.split("\n")) {
    const match = rawLine.match(lineRegex);
    if (!match) continue;

    const lineNum = parseInt(match[1], 10) - 1; // 1-based → 0-based
    const message = match[3].trim();

    // Filter: we handle unknown keys in-process with better messaging
    if (message.toLowerCase().includes("unknown field")) continue;

    if (lineNum < 0 || lineNum >= lines.length) continue;
    const line = lines[lineNum];
    if (!line) continue;

    // Reconstruct value range so code actions can target the right text
    const eqIndex = line.indexOf("=");
    let start: number;
    let end: number;
    if (eqIndex >= 0) {
      const trimmedValue = line.slice(eqIndex + 1).trim();
      start = trimmedValue
        ? line.indexOf(trimmedValue, eqIndex + 1)
        : eqIndex + 1;
      end = trimmedValue ? start + trimmedValue.length : start;
    } else {
      const key = (match[2] ?? "").trim();
      start = Math.max(0, line.indexOf(key));
      end = start + key.length;
    }

    diagnostics.push(
      Diagnostic.create(
        {
          start: { line: lineNum, character: start },
          end: { line: lineNum, character: end },
        },
        message,
        DiagnosticSeverity.Error,
      ),
    );
  }
  return diagnostics;
}

function validateInProcess(doc: TextDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const lines = doc.getText().split("\n");
  const seenKeys = new Map<string, number>(); // key → first-seen line index

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();

    if (trimmed.startsWith("#") || trimmed === "") continue;

    const eqIndex = line.indexOf("=");
    const keyPart = eqIndex >= 0 ? line.slice(0, eqIndex) : line;
    const key = keyPart.trim();
    if (!key) continue;

    const keyStart = line.indexOf(key);
    const keyRange = {
      start: { line: i, character: keyStart },
      end: { line: i, character: keyStart + key.length },
    };

    // Unknown key → warning
    if (!validKeys.has(key)) {
      diagnostics.push(
        Diagnostic.create(
          keyRange,
          `Unknown Ghostty config key: '${key}'`,
          DiagnosticSeverity.Warning,
        ),
      );
      continue;
    }

    // Duplicate key → info (skip additive keys)
    if (!additiveKeys.has(key)) {
      if (seenKeys.has(key)) {
        diagnostics.push(
          Diagnostic.create(
            keyRange,
            `Duplicate key '${key}' (first defined on line ${(seenKeys.get(key) as number) + 1})`,
            DiagnosticSeverity.Information,
          ),
        );
      } else {
        seenKeys.set(key, i);
      }
    }
  }

  return diagnostics;
}

async function validateDocumentAsync(
  connection: Connection,
  doc: TextDocument,
  token: { cancelled: boolean },
  inProcessDiags: Diagnostic[],
): Promise<void> {
  const output = await runGhosttyValidation(doc.getText());
  if (token.cancelled) return;

  const lines = doc.getText().split("\n");
  const cliDiags = parseGhosttyOutput(output, lines);

  connection.sendDiagnostics({
    uri: doc.uri,
    diagnostics: [...inProcessDiags, ...cliDiags],
  });
}

export function registerDiagnosticsProvider(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
): void {
  const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const validationTokens = new Map<string, { cancelled: boolean }>();

  function scheduleValidation(doc: TextDocument): void {
    const uri = doc.uri;

    // 1. Fire in-process diagnostics immediately
    const inProcessDiags = validateInProcess(doc);
    connection.sendDiagnostics({ uri, diagnostics: inProcessDiags });

    // 2. Cancel pending debounce + invalidate previous async token
    clearTimeout(debounceTimers.get(uri));
    const prevToken = validationTokens.get(uri);
    if (prevToken) prevToken.cancelled = true;

    // 3. Schedule async subprocess validation
    const token = { cancelled: false };
    validationTokens.set(uri, token);
    debounceTimers.set(
      uri,
      setTimeout(() => {
        debounceTimers.delete(uri);
        void validateDocumentAsync(connection, doc, token, inProcessDiags);
      }, 100),
    );
  }

  documents.onDidOpen((e) => scheduleValidation(e.document));
  documents.onDidChangeContent((e) => scheduleValidation(e.document));
  documents.onDidClose((e) => {
    const uri = e.document.uri;
    clearTimeout(debounceTimers.get(uri));
    debounceTimers.delete(uri);
    const token = validationTokens.get(uri);
    if (token) token.cancelled = true;
    validationTokens.delete(uri);
    connection.sendDiagnostics({ uri, diagnostics: [] });
  });
}
