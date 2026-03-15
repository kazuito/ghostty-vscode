import type { z } from "zod";

/**
 * Utility to generate prefixed/unprefixed pairs
 * @param prefix "no-"
 * @param items ["apple", "banana"]
 * @returns ["apple", "no-apple", "banana", "no-banana"]
 */
const withPrefix = (prefix: string, items: string[]) =>
  items.flatMap((item) => [item, `${prefix}${item}`]);

const bools = [true, false];

/**
 * Keys that can appear multiple times in a single config file (additive/list semantics).
 * These are never filtered out of completions even when already present in the document.
 */
export const additiveKeys = new Set([
  "keybind",
  "command-palette-entry",
  "custom-shader",
  "config-file",
  "gtk-custom-css",
  "input",
  "palette",

  "font-family",
  "font-family-bold",
  "font-family-italic",
  "font-family-bold-italic",
  "font-feature",
  "font-variation",
  "font-variation-bold",
  "font-variation-italic",
  "font-variation-bold-italic",
  "font-codepoint-map",

  "env",
]);

export type ConfigEntry = {
  key: string;
  desc: string;
  enum?: Array<string | number | boolean>;
  assets?: Array<"color" | "font">;
  comma?: boolean;
};

export const ghosttyConfigOptions: ConfigEntry[] = [
  {
    key: "language",
    desc: "UI/display language override for Ghostty. When unset, the system locale is used.",
  },

  // ── Font ──────────────────────────────────────────────────────────────────
  {
    key: "font-family",
    desc: "Primary font family for normal text. Can be repeated (additive) to specify fallback fonts for missing codepoints. Set to empty string to reset the list.",
    assets: ["font"],
  },
  {
    key: "font-family-bold",
    desc: "Font family for bold text. Falls back to font-family if unset. Can be repeated for fallback fonts.",
  },
  {
    key: "font-family-italic",
    desc: "Font family for italic text. Falls back to font-family if unset. Can be repeated for fallback fonts.",
  },
  {
    key: "font-family-bold-italic",
    desc: "Font family for bold italic text. Falls back to font-family if unset. Can be repeated for fallback fonts.",
  },
  {
    key: "font-style",
    desc: "Preferred named style (e.g. 'Regular', 'Light') for the normal font face. Set to false to disable the normal style entirely.",
    enum: bools,
  },
  {
    key: "font-style-bold",
    desc: "Preferred named style for the bold font face. Set to false to disable bold entirely.",
    enum: bools,
  },
  {
    key: "font-style-italic",
    desc: "Preferred named style for the italic font face. Set to false to disable italic entirely.",
    enum: bools,
  },
  {
    key: "font-style-bold-italic",
    desc: "Preferred named style for the bold italic font face. Set to false to disable bold italic entirely.",
    enum: bools,
  },

  {
    key: "font-synthetic-style",
    desc: "Controls whether Ghostty synthesizes bold/italic when the real face is unavailable. Use true/false to enable/disable all synthesis, or a comma-separated list of styles (prefix with 'no-' to disable).",
    enum: [...bools, ...withPrefix("no-", ["bold", "italic", "bold-italic"])],
    comma: true,
  },
  {
    key: "font-feature",
    desc: "OpenType font feature override. Use tag names like 'calt', '-calt' to disable. Multiple features can be comma-separated (e.g. '-calt,-liga'). This key is additive.",
    comma: true,
  },
  {
    key: "font-size",
    desc: "Base terminal font size in points.",
  },

  {
    key: "font-variation",
    desc: "Variable font axis setting for normal text. Format: 'AXIS=value' (e.g. 'wght=500'). Can be repeated for multiple axes.",
  },
  {
    key: "font-variation-bold",
    desc: "Variable font axis setting for bold text. Format: 'AXIS=value'. Can be repeated for multiple axes.",
  },
  {
    key: "font-variation-italic",
    desc: "Variable font axis setting for italic text. Format: 'AXIS=value'. Can be repeated for multiple axes.",
  },
  {
    key: "font-variation-bold-italic",
    desc: "Variable font axis setting for bold italic text. Format: 'AXIS=value'. Can be repeated for multiple axes.",
  },

  {
    key: "font-codepoint-map",
    desc: "Maps one or more Unicode codepoint ranges to a named font. Format: 'U+ABCD=FontName' or 'U+ABCD-U+DEFG=FontName'. Multiple ranges can be comma-separated before '='.",
    comma: true,
  },
  {
    key: "clipboard-codepoint-map",
    desc: "Maps a pasted clipboard codepoint or range to a replacement value. Format: 'U+ABCD=replacement'.",
  },

  {
    key: "font-thicken",
    desc: "Enables font thickening for better legibility on some displays. macOS only.",
    enum: bools,
  },
  {
    key: "font-thicken-strength",
    desc: "Strength of font thickening (0–255) when font-thicken is enabled. macOS only.",
  },

  {
    key: "font-shaping-break",
    desc: "Where Ghostty breaks font shaping runs, preventing ligatures from forming across the break. 'cursor' breaks at the cursor position. Prefix with 'no-' to disable. Multiple values can be comma-separated.",
    enum: withPrefix("no-", ["cursor"]),
    comma: true,
  },

  {
    key: "alpha-blending",
    desc: "Alpha blending algorithm for rendering transparent backgrounds. 'native': platform default; 'linear': blend in linear light; 'linear-corrected': linear with gamma correction.",
    enum: ["native", "linear", "linear-corrected"],
  },

  // ── Adjust ────────────────────────────────────────────────────────────────
  {
    key: "adjust-cell-width",
    desc: "Adjust terminal cell width. Accepts an integer (pixels) or percentage string (e.g. '20%', '-15%'). Additive to the font-derived metric.",
  },
  {
    key: "adjust-cell-height",
    desc: "Adjust terminal cell height. Accepts an integer or percentage. The font is centered vertically in the adjusted cell.",
  },
  {
    key: "adjust-font-baseline",
    desc: "Adjust the font baseline position within the cell. Accepts an integer or percentage.",
  },
  {
    key: "adjust-underline-position",
    desc: "Adjust underline vertical position. Accepts an integer or percentage.",
  },
  {
    key: "adjust-underline-thickness",
    desc: "Adjust underline thickness. Accepts an integer or percentage. Cannot go below 1px minimum.",
  },
  {
    key: "adjust-strikethrough-position",
    desc: "Adjust strikethrough vertical position. Accepts an integer or percentage.",
  },
  {
    key: "adjust-strikethrough-thickness",
    desc: "Adjust strikethrough thickness. Accepts an integer or percentage. Cannot go below 1px minimum.",
  },
  {
    key: "adjust-overline-position",
    desc: "Adjust overline vertical position. Accepts an integer or percentage.",
  },
  {
    key: "adjust-overline-thickness",
    desc: "Adjust overline thickness. Accepts an integer or percentage. Cannot go below 1px minimum.",
  },
  {
    key: "adjust-cursor-thickness",
    desc: "Adjust bar/underline cursor thickness. Accepts an integer or percentage.",
  },
  {
    key: "adjust-cursor-height",
    desc: "Adjust cursor height. Accepts an integer or percentage.",
  },
  {
    key: "adjust-box-thickness",
    desc: "Adjust box drawing character line thickness. Accepts an integer or percentage.",
  },
  {
    key: "adjust-icon-height",
    desc: "Adjust maximum height for Nerd Font icons. Default is 1.2× capital letter height. Accepts an integer or percentage (e.g. '-16.6%'). Available since 1.2.0.",
  },

  {
    key: "grapheme-width-method",
    desc: "Method for calculating grapheme cluster cell width. 'unicode': follows the Unicode standard; 'legacy': wcswidth-style calculation for compatibility with older programs.",
    enum: ["unicode", "legacy"],
  },
  {
    key: "freetype-load-flags",
    desc: "FreeType font loading/hinting flags for Linux rendering. Use true/false for defaults/none, or specify individual flags. Multiple flags can be combined with commas.",
    enum: [
      ...bools,
      ...withPrefix("no-", [
        "hinting",
        "force-autohint",
        "monochrome",
        "autohint",
        "light",
      ]),
    ],
    comma: true,
  },

  // ── Theme / Colors ────────────────────────────────────────────────────────
  {
    key: "theme",
    desc: "Named Ghostty color theme to load. Supports separate light/dark themes via 'dark:<name>,light:<name>' syntax.",
    comma: true,
  },
  {
    key: "background",
    desc: "Terminal background color. Accepts a hex color (#RRGGBB or RRGGBB) or a named X11 color.",
    assets: ["color"],
  },
  {
    key: "foreground",
    desc: "Terminal foreground (text) color. Accepts a hex color (#RRGGBB or RRGGBB) or a named X11 color.",
    assets: ["color"],
  },

  {
    key: "background-image",
    desc: "Path to an image file to display as the terminal background. Available since Ghostty 1.2.0.",
  },
  {
    key: "background-image-opacity",
    desc: "Opacity of the background image. Values above 1.0 boost image opacity relative to background-opacity. Available since Ghostty 1.2.0.",
  },
  {
    key: "background-image-position",
    desc: "Placement of the background image within the terminal window. Available since Ghostty 1.2.0.",
    enum: [
      "center",
      "center-right",
      "center-left",
      "top-center",
      "top-right",
      "top-left",
      "bottom-center",
      "bottom-right",
      "bottom-left",
    ],
  },
  {
    key: "background-image-fit",
    desc: "How the background image is scaled. 'contain': fit preserving aspect ratio; 'cover': fill potentially clipping; 'stretch': fill ignoring aspect ratio; 'none': original size. Available since Ghostty 1.2.0.",
    enum: ["contain", "cover", "stretch", "none"],
  },
  {
    key: "background-image-repeat",
    desc: "Whether the background image tiles to fill the terminal area. Available since Ghostty 1.2.0.",
    enum: bools,
  },

  {
    key: "selection-foreground",
    desc: "Foreground color for selected text. Also accepts 'cell-foreground' or 'cell-background' to match the cell's colors dynamically (since 1.2.0).",
  },
  {
    key: "selection-background",
    desc: "Background color for selected text. Also accepts 'cell-foreground' or 'cell-background' to match the cell's colors dynamically (since 1.2.0).",
  },
  {
    key: "selection-clear-on-typing",
    desc: "Whether the active selection is cleared when typing.",
    enum: bools,
  },
  {
    key: "selection-clear-on-copy",
    desc: "Whether the selection is cleared after copying via copy_to_clipboard. Does not apply to copy-on-select.",
    enum: bools,
  },
  {
    key: "selection-word-chars",
    desc: "Extra characters treated as word constituents when double-clicking to select a word.",
  },
  {
    key: "minimum-contrast",
    desc: "Minimum WCAG 2.0 contrast ratio (1–21) between foreground and background colors. Higher values ensure legibility but may force text black or white.",
  },
  {
    key: "palette",
    desc: "Sets one of the 16 ANSI terminal palette colors. Format: '<index>=<#RRGGBB>' where index is 0–15. Additive — each line sets one color entry.",
  },
  {
    key: "palette-generate",
    desc: "When true, auto-generates the 16-color palette from the configured background and foreground colors.",
    enum: bools,
  },
  {
    key: "palette-harmonious",
    desc: "When true, adjusts palette colors to be more harmonious with the configured background and foreground.",
    enum: bools,
  },

  {
    key: "cursor-color",
    desc: "Terminal cursor color. Accepts hex (#RRGGBB or RRGGBB) or a named X11 color.",
  },
  {
    key: "cursor-opacity",
    desc: "Opacity of the terminal cursor (0–1).",
  },
  {
    key: "cursor-style",
    desc: "Visual style of the terminal cursor. Programs can override this via DECSCUSR.",
    enum: ["block", "bar", "underline", "block_hollow"],
  },
  {
    key: "cursor-style-blink",
    desc: "Default blinking state of the cursor. When unset, respects DEC Mode 12. When explicitly set, DEC Mode 12 is ignored.",
    enum: bools,
  },
  {
    key: "cursor-text",
    desc: "Color of text drawn under the cursor. Also accepts 'cell-foreground' or 'cell-background' (since 1.2.0).",
  },
  {
    key: "cursor-click-to-move",
    desc: "Allows repositioning the cursor via alt+click (option+click on macOS) at shell prompts. Requires shell integration.",
    enum: bools,
  },

  {
    key: "mouse-hide-while-typing",
    desc: "Hides the mouse cursor while typing. Reappears on mouse movement.",
    enum: bools,
  },
  {
    key: "scroll-to-bottom",
    desc: "Controls when the terminal auto-scrolls to the bottom. Comma-separated flags: 'keystroke' scrolls on key presses to PTY; 'output' scrolls on new output. Prefix with 'no-' to disable.",
    enum: [...bools, ...withPrefix("no-", ["keystroke", "output"])],
    comma: true,
  },
  {
    key: "mouse-shift-capture",
    desc: "Controls Shift+click behavior. false/true allow program override via XTSHIFTESCAPE; 'never'/'always' prevent program override.",
    enum: [...bools, "always", "never"],
  },
  {
    key: "mouse-reporting",
    desc: "Enables mouse reporting to running programs. Programs can also toggle this via escape sequences.",
    enum: bools,
  },
  {
    key: "mouse-scroll-multiplier",
    desc: "Multiplier for mouse wheel scrolling distance. Default 3 scrolls 3 lines per wheel tick.",
  },

  {
    key: "background-opacity",
    desc: "Opacity of the terminal window background (0–1). Values below 1 enable transparency. Pair with background-blur for a frosted-glass effect.",
  },
  {
    key: "background-opacity-cells",
    desc: "When true, applies background-opacity to cells with an explicit background color set (useful for Neovim, Tmux).",
    enum: bools,
  },
  {
    key: "background-blur",
    desc: "Background blur radius when background-opacity < 1. 0 disables blur. Platform support varies.",
  },
  {
    key: "unfocused-split-opacity",
    desc: "Opacity of unfocused terminal splits (0.15–1) to visually distinguish the active split.",
  },
  {
    key: "unfocused-split-fill",
    desc: "Color of the overlay used to dim unfocused splits. Defaults to the terminal background color.",
    assets: ["color"],
  },
  {
    key: "split-divider-color",
    desc: "Color of dividers between split terminal panes.",
    assets: ["color"],
  },
  {
    key: "split-preserve-zoom",
    desc: "When true, creating a new split preserves the zoom state of the current split rather than unzooming.",
    enum: bools,
  },

  {
    key: "search-foreground",
    desc: "Foreground color for search match highlights.",
    assets: ["color"],
  },
  {
    key: "search-background",
    desc: "Background color for search match highlights.",
    assets: ["color"],
  },
  {
    key: "search-selected-foreground",
    desc: "Foreground color for the active (currently selected) search match.",
    assets: ["color"],
  },
  {
    key: "search-selected-background",
    desc: "Background color for the active (currently selected) search match.",
    assets: ["color"],
  },

  // ── Command / Env ─────────────────────────────────────────────────────────
  {
    key: "command",
    desc: "Shell or command to run in each terminal surface. Defaults to the SHELL environment variable or the user's shell from /etc/passwd.",
  },
  {
    key: "initial-command",
    desc: "Like 'command', but applies only to the first terminal surface. Also set via 'ghostty -e <args>'.",
  },
  {
    key: "notify-on-command-finish",
    desc: "When to send a notification after a command finishes. 'unfocused': only when the window is not focused.",
    enum: ["never", "unfocused", "always"],
  },
  {
    key: "notify-on-command-finish-action",
    desc: "Action(s) when notify-on-command-finish fires. 'bell': ring the terminal bell; 'notify': desktop notification. Multiple values can be comma-separated.",
    enum: withPrefix("no-", ["bell", "notify"]),
    comma: true,
  },
  {
    key: "notify-on-command-finish-after",
    desc: "Minimum command runtime before notify-on-command-finish fires (e.g. '500ms', '1s').",
  },

  {
    key: "env",
    desc: "Extra environment variable for terminal surfaces in KEY=VALUE format. Set KEY= to remove a var, or env = to reset all. Additive.",
  },
  {
    key: "input",
    desc: "Data to write to the pty before user input. Format: 'raw:<string>' or 'path:<file>'. Additive — values are concatenated.",
  },
  {
    key: "wait-after-command",
    desc: "When true, the window remains open after the command exits until any key is pressed.",
    enum: bools,
  },
  {
    key: "abnormal-command-exit-runtime",
    desc: "Runtime threshold (ms) below which a non-zero exit is treated as abnormal. 0 disables the check.",
  },
  {
    key: "scrollback-limit",
    desc: "Maximum scrollback buffer lines. 0 disables scrollback entirely. Per-surface limit.",
  },

  {
    key: "scrollbar",
    desc: "Scrollbar visibility. 'system': follows platform conventions; 'never': always hide the scrollbar.",
    enum: ["system", "never"],
  },

  {
    key: "link",
    desc: "Enables automatic hyperlink detection in terminal output.",
    enum: bools,
  },
  {
    key: "link-url",
    desc: "Enables detection and highlighting of URL patterns as clickable links.",
    enum: bools,
  },
  {
    key: "link-previews",
    desc: "Shows a preview tooltip when hovering over detected links.",
    enum: bools,
  },

  // ── Window ────────────────────────────────────────────────────────────────
  {
    key: "maximize",
    desc: "Start the window in a maximized state.",
    enum: bools,
  },
  {
    key: "fullscreen",
    desc: "Start the window in fullscreen mode.",
    enum: bools,
  },
  {
    key: "title",
    desc: "Override the default window title. Applications can still change the title via OSC 2.",
  },
  {
    key: "class",
    desc: "Sets WM_CLASS on X11/Wayland and the GTK application ID.",
  },
  {
    key: "x11-instance-name",
    desc: "X11 WM_CLASS instance name (first component). X11 builds only.",
  },
  {
    key: "working-directory",
    desc: "Initial working directory. 'home': user's home directory; 'inherit': parent process cwd; or an absolute path.",
    enum: ["home", "inherit"],
  },

  {
    key: "keybind",
    desc: "Custom key binding rule. Format: '<mods>+<key>=<action>'. Use 'keybind = clear' to remove all defaults. Additive.",
  },
  {
    key: "key-remap",
    desc: "Keyboard remapping rule. Format: '<from>=<to>'. Processed before keybind rules.",
  },

  {
    key: "window-padding-x",
    desc: "Horizontal padding inside the window in points. Single value for both sides; 'left,right' for asymmetric padding.",
    comma: true
  },
  {
    key: "window-padding-y",
    desc: "Vertical padding inside the window in points. Single value for both sides; 'top,bottom' for asymmetric padding.",
    comma: true
  },
  {
    key: "window-padding-balance",
    desc: "When true, distributes leftover pixel space evenly as additional padding rather than leaving it at the right/bottom edge.",
    enum: bools,
  },
  {
    key: "window-padding-color",
    desc: "Color of the padding area. 'background': terminal background; 'extend': extends nearest cell color; 'extend-always': always extends even with program-set backgrounds.",
    enum: ["background", "extend", "extend-always"],
  },
  {
    key: "window-vsync",
    desc: "Enables vertical sync for the terminal renderer. Disabling may reduce latency at the cost of tearing.",
    enum: bools,
  },

  {
    key: "window-inherit-working-directory",
    desc: "New windows and tabs inherit the working directory of the focused window.",
    enum: bools,
  },
  {
    key: "tab-inherit-working-directory",
    desc: "New tabs inherit the working directory of the focused tab.",
    enum: bools,
  },
  {
    key: "split-inherit-working-directory",
    desc: "New splits inherit the working directory of the focused split.",
    enum: bools,
  },
  {
    key: "window-inherit-font-size",
    desc: "New windows and tabs inherit the font size of the focused window.",
    enum: bools,
  },

  {
    key: "window-decoration",
    desc: "Window decorations (title bar, borders). 'auto': platform default; 'none': remove decorations; 'client': client-side; 'server': server-side. 'true'/'false' are aliases for 'auto'/'none'.",
    enum: ["false", "none", "true", "auto", "client", "server"],
  },
  {
    key: "window-title-font-family",
    desc: "Font family for window and tab title bars. Any system font; does not need to be monospace.",
    assets: ["font"],
  },
  {
    key: "window-subtitle",
    desc: "Subtitle shown below the main window title where the platform supports it. 'false': disable the subtitle; 'working-directory': show the current working directory.",
    enum: ["false", "working-directory"],
  },
  {
    key: "window-theme",
    desc: "Window chrome color theme. 'auto': matches system appearance; 'ghostty': derived from the terminal background color.",
    enum: ["auto", "system", "light", "dark", "ghostty"],
  },
  {
    key: "window-colorspace",
    desc: "Color space for terminal rendering. 'display-p3' enables wide-gamut color on supported displays (macOS only).",
    enum: ["srgb", "display-p3"],
  },
  {
    key: "window-height",
    desc: "Initial window height in terminal grid rows. 0 uses the platform/system default.",
  },
  {
    key: "window-width",
    desc: "Initial window width in terminal grid columns. 0 uses the platform/system default.",
  },
  {
    key: "window-position-x",
    desc: "Initial window X position in screen pixels.",
  },
  {
    key: "window-position-y",
    desc: "Initial window Y position in screen pixels.",
  },
  {
    key: "window-save-state",
    desc: "Controls saving and restoring window state (size, position). 'default': follows platform behavior.",
    enum: ["default", "never", "always"],
  },
  {
    key: "window-step-resize",
    desc: "When true, window resizing snaps to terminal cell boundaries.",
    enum: bools,
  },
  {
    key: "window-new-tab-position",
    desc: "Where newly opened tabs are inserted. 'current': after the active tab; 'end': at the last position.",
    enum: ["current", "end"],
  },
  {
    key: "window-show-tab-bar",
    desc: "Tab bar visibility. 'auto': shows only when more than one tab is open.",
    enum: ["auto", "always", "never"],
  },
  {
    key: "window-titlebar-background",
    desc: "Background color of the window titlebar on GTK.",
    assets: ["color"],
  },
  {
    key: "window-titlebar-foreground",
    desc: "Foreground (text/icon) color of the window titlebar on GTK.",
    assets: ["color"],
  },

  {
    key: "resize-overlay",
    desc: "Shows a size overlay while resizing. 'after-first': for all resizes except the initial window creation.",
    enum: ["always", "never", "after-first"],
  },
  {
    key: "resize-overlay-position",
    desc: "Screen position of the resize size overlay.",
    enum: [
      "center",
      "top-left",
      "top-center",
      "top-right",
      "bottom-left",
      "bottom-center",
      "bottom-right",
    ],
  },
  {
    key: "resize-overlay-duration",
    desc: "How long the resize overlay stays visible after the last resize event.",
  },

  {
    key: "focus-follows-mouse",
    desc: "When true, focus follows mouse hover within Ghostty split panes.",
    enum: bools,
  },

  // ── Clipboard ─────────────────────────────────────────────────────────────
  {
    key: "clipboard-read",
    desc: "Permission for applications to read from the clipboard via OSC 52. 'ask': prompts the user each time.",
    enum: ["ask", "allow", "deny"],
  },
  {
    key: "clipboard-write",
    desc: "Permission for applications to write to the clipboard via OSC 52.",
    enum: ["ask", "allow", "deny"],
  },
  {
    key: "clipboard-trim-trailing-spaces",
    desc: "When true, trailing whitespace is stripped from text copied to the clipboard.",
    enum: bools,
  },
  {
    key: "clipboard-paste-protection",
    desc: "When true, detects potentially dangerous paste content and prompts for confirmation.",
    enum: bools,
  },
  {
    key: "clipboard-paste-bracketed-safe",
    desc: "When true, content pasted via bracketed paste mode bypasses clipboard-paste-protection checks.",
    enum: bools,
  },

  {
    key: "title-report",
    desc: "When true, allows applications to query the terminal's current title via OSC escape sequences.",
    enum: bools,
  },
  {
    key: "image-storage-limit",
    desc: "Maximum bytes used to cache images displayed via Kitty graphics protocol or sixel. Default is ~320 MB.",
  },
  {
    key: "copy-on-select",
    desc: "Automatically copies selected text. true: to selection clipboard (primary on Linux); 'clipboard': also to system clipboard; false: disables auto-copy.",
    enum: [...bools, "clipboard"],
  },
  {
    key: "right-click-action",
    desc: "Action performed on right-click. 'copy-or-paste': copies if text is selected, otherwise pastes.",
    enum: ["context-menu", "paste", "copy", "copy-or-paste", "ignore"],
  },
  {
    key: "click-repeat-interval",
    desc: "Interval in milliseconds for repeated click detection (double-click, triple-click). Set to 0 to use the platform default.",
  },

  {
    key: "config-file",
    desc: "Path to an additional config file to load. Config files load in order; later values override earlier. Additive.",
  },
  {
    key: "config-default-files",
    desc: "When false, default config file locations are not loaded automatically.",
    enum: bools,
  },

  {
    key: "confirm-close-surface",
    desc: "Whether to confirm before closing a terminal with a running process. true: prompts when process is running; 'always': always prompts; false: never prompts.",
    enum: [...bools, "always"],
  },

  {
    key: "quit-after-last-window-closed",
    desc: "Quit the application after the last window closes. Default is true on Linux, false on macOS.",
    enum: bools,
  },
  {
    key: "quit-after-last-window-closed-delay",
    desc: "Duration to wait before quitting after the last window closes. Only effective when quit-after-last-window-closed is true.",
  },

  {
    key: "initial-window",
    desc: "Whether to create an initial window at startup. Setting to false runs Ghostty as a background service.",
    enum: bools,
  },
  {
    key: "undo-timeout",
    desc: "How long undoable actions (e.g. closing a tab) remain reversible. macOS only.",
  },

  // ── Quick Terminal ────────────────────────────────────────────────────────
  {
    key: "quick-terminal-position",
    desc: "Edge or position where the quick (drop-down/Quake-style) terminal appears.",
    enum: ["top", "bottom", "left", "right", "center"],
  },

  {
    key: "quick-terminal-size",
    desc: "Size of the quick terminal as a percentage of the screen dimension in the direction it slides from.",
  },
  {
    key: "gtk-quick-terminal-layer",
    desc: "Wayland layer-shell layer used by the quick terminal on GTK. 'overlay' renders above all windows.",
    enum: ["overlay", "top", "bottom", "background"],
  },
  {
    key: "gtk-quick-terminal-namespace",
    desc: "Namespace identifier for the quick terminal window on Wayland, used by the compositor. GTK/Wayland only.",
  },
  {
    key: "quick-terminal-screen",
    desc: "Which screen the quick terminal appears on. 'mouse': screen under the mouse cursor; 'macos-menu-bar': screen with the macOS menu bar.",
    enum: ["main", "mouse", "macos-menu-bar"],
  },
  {
    key: "quick-terminal-animation-duration",
    desc: "Duration of the slide animation when toggling the quick terminal, in seconds. Set to '0' to disable animation.",
  },
  {
    key: "quick-terminal-autohide",
    desc: "Automatically hides the quick terminal when it loses focus.",
    enum: bools,
  },
  {
    key: "quick-terminal-space-behavior",
    desc: "Controls whether the quick terminal follows to a new macOS Space ('move') or stays on the Space where it was opened ('remain').",
    enum: ["move", "remain"],
  },
  {
    key: "quick-terminal-keyboard-interactivity",
    desc: "Controls when the quick terminal receives keyboard input. Primarily affects Linux Wayland. Available since v1.2.0.",
    enum: ["none", "on-demand", "exclusive"],
  },

  // ── Shell Integration ─────────────────────────────────────────────────────
  {
    key: "shell-integration",
    desc: "Shell integration injection mode. 'detect': auto-detect the shell; a specific shell name forces injection; 'none': disable injection entirely.",
    enum: ["none", "detect", "bash", "elvish", "fish", "nushell", "zsh"],
  },
  {
    key: "shell-integration-features",
    desc: "Shell integration sub-features to enable. Use true/false for all on/off, or a comma-separated list. Features: cursor, sudo, title, ssh-env, ssh-terminfo, path. Prefix with 'no-' to disable.",
    enum: [
      ...bools,
      ...withPrefix("no-", [
        "cursor",
        "sudo",
        "title",
        "ssh-env",
        "ssh-terminfo",
        "path",
      ]),
    ],
    comma: true,
  },
  {
    key: "command-palette-entry",
    desc: "Custom command palette entry. Format: 'title:My Action,action:csi:0m'. Additive. Set to empty string to clear defaults. Available since v1.2.0.",
  },
  {
    key: "osc-color-report-format",
    desc: "Bit-depth format for OSC color query responses. 'none': disable reporting; '8-bit': 8-bit per channel; '16-bit': 16-bit per channel (most compatible).",
    enum: ["none", "8-bit", "16-bit"],
  },
  {
    key: "vt-kam-allowed",
    desc: "Whether to allow VT Keyboard Action Mode (KAM), which suppresses keyboard input. Disabled by default for security.",
    enum: bools,
  },

  {
    key: "custom-shader",
    desc: "Path to a custom GLSL fragment shader for post-processing effects. Can be repeated (additive) to stack shaders.",
  },
  {
    key: "custom-shader-animation",
    desc: "Whether custom shaders receive continuous animation frames. 'true': only on content change; 'false': static; 'always': continuously.",
    enum: [...bools, "always"],
  },

  {
    key: "bell-features",
    desc: "Terminal bell features. Comma-separated: 'system': OS beep; 'audio': custom audio file (GTK); 'attention': dock/taskbar highlight; 'title': bell emoji in window title; 'border': flash window border. Prefix with 'no-' to disable.",
    enum: withPrefix("no-", [
      "system",
      "audio",
      "attention",
      "title",
      "border",
    ]),
    comma: true,
  },
  {
    key: "bell-audio-path",
    desc: "Path to an audio file for bell sound. Requires 'audio' in bell-features. GTK only.",
  },
  {
    key: "bell-audio-volume",
    desc: "Volume of bell audio playback (0–1). GTK only.",
  },

  {
    key: "app-notifications",
    desc: "App-level notification types to enable or disable. Use true/false for all on/off, or a comma-separated list of specific notifications: clipboard-copy, config-reload. Prefix with 'no-' to disable.",
    enum: [...bools, ...withPrefix("no-", ["clipboard-copy", "config-reload"])],
    comma: true,
  },

  // ── macOS ─────────────────────────────────────────────────────────────────
  {
    key: "macos-non-native-fullscreen",
    desc: "Use non-native (custom) fullscreen on macOS. 'visible-menu': non-native fullscreen but keeps the menu bar visible.",
    enum: [...bools, "visible-menu"],
  },
  {
    key: "macos-window-buttons",
    desc: "macOS traffic-light button (close/minimize/zoom) visibility and style.",
    enum: ["visible", "hidden", "macos-native"],
  },
  {
    key: "macos-titlebar-style",
    desc: "macOS titlebar appearance. 'transparent': blends into terminal background; 'tabs': integrated tab bar; 'hidden': hides titlebar entirely.",
    enum: ["native", "transparent", "tabs", "hidden"],
  },
  {
    key: "macos-titlebar-proxy-icon",
    desc: "Visibility of the proxy icon (folder icon representing cwd) in the macOS titlebar. Only shown with 'native' titlebar style.",
    enum: ["visible", "hidden"],
  },
  {
    key: "macos-dock-drop-behavior",
    desc: "Action when a file/folder is dropped onto the Ghostty Dock icon. 'new-tab': open in new tab; 'new-window': always open a new window.",
    enum: ["new-tab", "new-window"],
  },
  {
    key: "macos-option-as-alt",
    desc: "How the macOS Option key maps to Alt. true: both Option keys; false: standard macOS behavior; 'left'/'right': only that Option key.",
    enum: [...bools, "left", "right"],
  },
  {
    key: "macos-window-shadow",
    desc: "Whether to show a drop shadow beneath Ghostty windows on macOS.",
    enum: bools,
  },
  {
    key: "macos-hidden",
    desc: "Whether Ghostty launches hidden on macOS. 'never': normal launch; 'always': launch hidden.",
    enum: ["never", "always"],
  },
  {
    key: "macos-auto-secure-input",
    desc: "Automatically enables macOS Secure Input mode when a password prompt is detected.",
    enum: bools,
  },
  {
    key: "macos-secure-input-indication",
    desc: "Shows a visual indicator in the titlebar when macOS Secure Input mode is active.",
    enum: bools,
  },
  {
    key: "macos-applescript",
    desc: "Whether to allow AppleScript to control Ghostty on macOS.",
    enum: bools,
  },
  {
    key: "macos-icon",
    desc: "macOS app icon variant. 'official': default icon; 'blueprint'/'chalkboard'/'retro': artist variants; 'custom': user-provided image (requires macos-custom-icon); 'custom-style': custom colors on official icon layers.",
    enum: [
      "official",
      "blueprint",
      "chalkboard",
      "retro",
      "custom",
      "custom-style",
    ],
  },
  {
    key: "macos-custom-icon",
    desc: "Path to a custom image file for the macOS app icon. Required when macos-icon is 'custom'.",
  },
  {
    key: "macos-icon-frame",
    desc: "Frame material style for the custom-style macOS app icon. Required when macos-icon is 'custom-style'.",
    enum: ["aluminum", "beige", "plastic", "chrome"],
  },
  {
    key: "macos-icon-ghost-color",
    desc: "Color for the ghost element in the custom-style macOS app icon. Required when macos-icon is 'custom-style'.",
    assets: ["color"],
  },
  {
    key: "macos-icon-screen-color",
    desc: "One or more comma-separated colors for the screen in the custom-style macOS app icon. Multiple colors create a gradient.",
    comma: true,
  },
  {
    key: "macos-shortcuts",
    desc: "Permission policy for macOS Global Shortcuts integration.",
    enum: ["ask", "allow", "deny"],
  },

  // ── Linux ─────────────────────────────────────────────────────────────────
  {
    key: "linux-cgroup",
    desc: "Controls whether Ghostty places each terminal process into its own Linux cgroup. 'single-instance': only when running as a single instance.",
    enum: ["never", "always", "single-instance"],
  },
  {
    key: "linux-cgroup-memory-limit",
    desc: "Soft memory limit (bytes) for each terminal process cgroup via memory.high. Unset means no limit.",
  },
  {
    key: "linux-cgroup-processes-limit",
    desc: "Hard limit on the number of processes for each terminal process cgroup via pids.max. Unset means no limit.",
  },
  {
    key: "linux-cgroup-hard-fail",
    desc: "When true, Ghostty exits with an error if cgroup setup fails rather than continuing without isolation.",
    enum: bools,
  },

  // ── GTK ───────────────────────────────────────────────────────────────────
  {
    key: "gtk-opengl-debug",
    desc: "Enables OpenGL debug output on GTK builds, printing GL errors to stderr. For development use.",
    enum: bools,
  },
  {
    key: "gtk-single-instance",
    desc: "Single-instance behavior on GTK/Linux. 'detect': auto-detect; true: always single-instance; false: allow multiple instances.",
    enum: [...bools, "detect"],
  },
  {
    key: "gtk-titlebar",
    desc: "Whether to show the GTK client-side titlebar (CSD). Set to false to hide the titlebar.",
    enum: bools,
  },
  {
    key: "gtk-tabs-location",
    desc: "Location of the tab bar in the GTK window.",
    enum: ["top", "bottom"],
  },
  {
    key: "gtk-titlebar-hide-when-maximized",
    desc: "Automatically hides the GTK titlebar when the window is maximized, reclaiming vertical space.",
    enum: bools,
  },
  {
    key: "gtk-toolbar-style",
    desc: "Visual style of the GTK toolbar/tab bar. 'flat': no border (default); 'raised': elevated shadow; 'raised-border': elevated with border.",
    enum: ["raised", "raised-border", "flat"],
  },
  {
    key: "gtk-titlebar-style",
    desc: "Style of the GTK titlebar. 'native': traditional titlebar with separate tab bar; 'tabs': tab bar integrated into the titlebar to save vertical space.",
    enum: ["native", "tabs"],
  },
  {
    key: "gtk-wide-tabs",
    desc: "Whether GTK tabs expand to fill available horizontal space rather than being sized to their content.",
    enum: bools,
  },
  {
    key: "gtk-custom-css",
    desc: "Path to a custom CSS file for GTK theming. Can be specified multiple times (additive).",
  },

  {
    key: "desktop-notifications",
    desc: "Whether Ghostty is allowed to send desktop notifications (e.g. via OSC 9 or OSC 777).",
    enum: bools,
  },
  {
    key: "progress-style",
    desc: "Progress indicator style(s). Comma-separated: 'floating': overlay in terminal; 'dock': taskbar/dock indicator; 'hidden': suppress display. Prefix with 'no-' to disable.",
    enum: withPrefix("no-", ["floating", "hidden", "dock"]),
    comma: true,
  },

  {
    key: "bold-color",
    desc: "Color for bold text. 'bright': uses the bright variant of the configured foreground. If unset, bold text uses the same color as normal text.",
    enum: ["bright"],
    assets: ["color"],
  },

  {
    key: "faint-opacity",
    desc: "Opacity multiplier for faint/dim text (SGR attribute 2). Range 0–1; default 0.5.",
  },
  {
    key: "term",
    desc: "Value for the TERM environment variable inside the terminal. Change only if applications have compatibility issues with the Ghostty terminfo entry.",
  },
  {
    key: "enquiry-response",
    desc: "String sent in response to the terminal ENQ (Ctrl+E) control character. Empty string by default.",
  },

  {
    key: "async-backend",
    desc: "Async I/O backend on Linux. 'auto': prefers io_uring with epoll fallback.",
    enum: ["auto", "epoll", "io_uring"],
  },

  {
    key: "auto-update",
    desc: "Auto-update behavior on macOS. 'off': disable; 'check': notify only; 'download': auto-download. Linux uses system package managers.",
    enum: ["off", "check", "download"],
  },
  {
    key: "auto-update-channel",
    desc: "Release channel for auto-updates on macOS. 'tip': pre-release builds from main branch.",
    enum: ["stable", "tip"],
  },
] as const;

export const optionByKey = new Map(
  ghosttyConfigOptions.map((option) => [option.key, option] as const),
);

export const validKeys = new Set<string>(
  ghosttyConfigOptions.map((o) => o.key),
);

export const commaKeys = new Set<string>(
  ghosttyConfigOptions.filter((o) => o.comma).map((o) => o.key),
);

export function extractSchemaValues(schema: z.ZodType): string[] | null {
  const def = (schema as unknown as { _zod: { def: Record<string, unknown> } })
    ._zod.def;

  switch (def.type) {
    case "boolean":
      return ["true", "false"];
    case "enum":
      return Object.keys(def.entries as Record<string, unknown>);
    case "literal":
      return (def.values as unknown[]).map(String);
    case "union": {
      const results: string[] = [];
      for (const option of def.options as z.ZodType[]) {
        const values = extractSchemaValues(option);
        if (values) results.push(...values);
      }
      return results.length > 0 ? results : null;
    }
    default:
      return null;
  }
}
