/** Timeout for shelling out to the ghostty CLI. */
export const GHOSTTY_CLI_TIMEOUT_MS = 5000;

/** Subcommands and flags of the ghostty CLI contract. */
export const GHOSTTY_CLI_FLAGS = {
  VALIDATE_CONFIG: "+validate-config",
  SHOW_CONFIG: "+show-config",
  LIST_FONTS: "+list-fonts",
  LIST_ACTIONS: "+list-actions",
  DEFAULT: "--default",
  DOCS: "--docs",
} as const;

export const GHOSTTY_CONFIG_FILE_FLAG_PREFIX = "--config-file=" as const;
