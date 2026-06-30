import path from "node:path";

export const GHOSTTY_CONFIG_LANGUAGE_ID = "ghostty-config" as const;

export const GHOSTTY_LSP_ID = "ghosttyLsp" as const;
export const GHOSTTY_LSP_NAME = "Ghostty Language Server" as const;

export const OUT_DIR = "out" as const;
export const OUT_SERVER_DIR = path.join(OUT_DIR, "server");
export const SERVER_MODULE_PATH = path.join(OUT_SERVER_DIR, "index.js");
