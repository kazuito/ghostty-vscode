import { runGhosttySync } from "./ghostty";

export interface GhosttyAction {
  name: string;
  doc: string;
}

export const ghosttyActions: GhosttyAction[] = [];

/**
 * Parse the output of `ghostty +list-actions --docs`.
 *
 * Format:
 *   action_name:
 *     First line of description.
 *
 *     More description text.
 *
 *   next_action:
 *     ...
 */
export function parseActionsOutput(output: string): GhosttyAction[] {
  const actions: GhosttyAction[] = [];
  let currentName: string | null = null;
  const currentDocLines: string[] = [];

  const flush = () => {
    if (currentName !== null) {
      actions.push({ name: currentName, doc: currentDocLines.join("\n").trim() });
    }
  };

  for (const line of output.split("\n")) {
    // Action name lines: no leading whitespace, end with ":"
    if (/^\S.*:$/.test(line)) {
      flush();
      currentName = line.slice(0, -1).trim();
      currentDocLines.length = 0;
    } else if (currentName !== null) {
      currentDocLines.push(line.replace(/^  /, ""));
    }
  }
  flush();

  return actions;
}

export function loadGhosttyActions(executablePath?: string): void {
  ghosttyActions.length = 0;
  const output = runGhosttySync(["+list-actions", "--docs"], executablePath);
  ghosttyActions.push(...parseActionsOutput(output));
}
