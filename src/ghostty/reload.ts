import { ghosttyActions, loadGhosttyActionsAsync } from "./actions";
import { ghosttyDefaults, loadGhosttyDefaultsAsync } from "./defaults";
import { ghosttyFonts, loadGhosttyFontsAsync } from "./fonts";
import { isGhosttyAvailableAsync } from "./ghostty";

export interface ReloadDeps {
  isAvailable: (executablePath?: string) => Promise<boolean>;
  loadDefaults: (executablePath?: string) => Promise<void>;
  loadFonts: (executablePath?: string) => Promise<void>;
  loadActions: (executablePath?: string) => Promise<void>;
}

const defaultDeps: ReloadDeps = {
  isAvailable: (executablePath) => isGhosttyAvailableAsync(executablePath),
  loadDefaults: loadGhosttyDefaultsAsync,
  loadFonts: loadGhosttyFontsAsync,
  loadActions: loadGhosttyActionsAsync,
};

export function clearGhosttyData(): void {
  ghosttyDefaults.clear();
  ghosttyFonts.length = 0;
  ghosttyActions.length = 0;
}

/**
 * Refresh CLI-derived data without blocking. Resolves true when the Ghostty CLI
 * was reachable and data loaded; false when it was unavailable, in which case
 * any cached data is cleared so consumers don't serve stale defaults.
 */
export async function reloadGhosttyData(
  executablePath?: string,
  deps: ReloadDeps = defaultDeps,
): Promise<boolean> {
  if (!(await deps.isAvailable(executablePath))) {
    clearGhosttyData();
    return false;
  }

  await Promise.all([
    deps.loadDefaults(executablePath),
    deps.loadFonts(executablePath),
    deps.loadActions(executablePath),
  ]);
  return true;
}
