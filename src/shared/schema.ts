import { z } from "zod";

const colorValue = z.union([
  z.string().regex(/^#?[0-9A-Fa-f]{6}$/), // hex or #hex
  z.enum(["cell-foreground", "cell-background"]).or(z.string()), // named X11 colors also allowed
]);

const hexOrNamedColor = z.union([
  z.string().regex(/^#?[0-9A-Fa-f]{6}$/),
  z.string().regex(/^\w+$/), // named X11 colors
]);

const opacity01 = z.number().min(0).max(1);

const durationString = z
  .string()
  .min(1)
  .regex(/^(\d+([ydhms]|[muµn]s))+$/);

const fontVariation = z
  .string()
  .regex(/^[A-Za-z0-9]{4}\s*=\s*-?\d+(?:\.\d+)?$/);
const fontCodepointMap = z
  .string()
  .regex(
    /^((U\+[0-9A-Fa-f]{4,6}(?:-U\+[0-9A-Fa-f]{4,6})?)(,(U\+[0-9A-Fa-f]{4,6}(?:-U\+[0-9A-Fa-f]{4,6})?))*)=.+$/,
  );
const clipboardCodepointMap = z
  .string()
  .regex(/^(U\+[0-9A-Fa-f]{4,6}(?:-U\+[0-9A-Fa-f]{4,6})?)=.*$/);
const envAssignment = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*=.*/);
const pathLike = z.string();
const featureSetting = z.string(); // syntax is intentionally loose in docs
const keybindLike = z.string();
const keyRemapLike = z.string();
const commandLike = z.string();
const cssPath = z.string();
const shaderPath = z.string();

// Accepts integer pixels or a percentage like "20%" or "-15.5%"
const pixelOrPercent = z.union([
  z.number(),
  z.string().regex(/^-?\d+(?:\.\d+)?%$/),
]);

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

type ConfigEntry = {
  key: string;
  schema: z.ZodType;
  desc: string;
  default?: unknown;
  comma?: boolean; // whether to allow comma-separated lists of values
};

export const ghosttyConfigOptions: ConfigEntry[] = [
  {
    key: "language",
    schema: z.string(),
    desc: "UI/display language override for Ghostty. When unset, the system locale is used.",
  },

  // ── Font ──────────────────────────────────────────────────────────────────
  {
    key: "font-family",
    schema: z.string(),
    desc: "Primary font family for normal text. Can be repeated (additive) to specify fallback fonts for missing codepoints. Set to empty string to reset the list.",
  },
  {
    key: "font-family-bold",
    schema: z.string(),
    desc: "Font family for bold text. Falls back to font-family if unset. Can be repeated for fallback fonts.",
  },
  {
    key: "font-family-italic",
    schema: z.string(),
    desc: "Font family for italic text. Falls back to font-family if unset. Can be repeated for fallback fonts.",
  },
  {
    key: "font-family-bold-italic",
    schema: z.string(),
    desc: "Font family for bold italic text. Falls back to font-family if unset. Can be repeated for fallback fonts.",
  },

  {
    key: "font-style",
    schema: z.union([z.string(), z.literal(false)]),
    desc: "Preferred named style (e.g. 'Regular', 'Light') for the normal font face. Set to false to disable the normal style entirely.",
  },
  {
    key: "font-style-bold",
    schema: z.union([z.string(), z.literal(false)]),
    desc: "Preferred named style for the bold font face. Set to false to disable bold entirely.",
  },
  {
    key: "font-style-italic",
    schema: z.union([z.string(), z.literal(false)]),
    desc: "Preferred named style for the italic font face. Set to false to disable italic entirely.",
  },
  {
    key: "font-style-bold-italic",
    schema: z.union([z.string(), z.literal(false)]),
    desc: "Preferred named style for the bold italic font face. Set to false to disable bold italic entirely.",
  },

  {
    key: "font-synthetic-style",
    schema: z.union([
      z.boolean(),
      z
        .string()
        .regex(
          /^(no-(bold|italic|bold-italic)|(bold|italic|bold-italic))(,(no-(bold|italic|bold-italic)|(bold|italic|bold-italic)))*$/,
        ),
    ]),
    default: true,
    desc: "Controls whether Ghostty synthesizes bold/italic when the real face is unavailable. Use true/false to enable/disable all synthesis, or a comma-separated list of styles (prefix with 'no-' to disable).",
    comma: true,
  },
  {
    key: "font-feature",
    schema: featureSetting,
    desc: "OpenType font feature override. Use tag names like 'calt', '-calt' to disable. Multiple features can be comma-separated (e.g. '-calt,-liga'). This key is additive.",
    comma: true,
  },
  {
    key: "font-size",
    schema: z.number().positive(),
    default: 12,
    desc: "Base terminal font size in points.",
  },

  {
    key: "font-variation",
    schema: fontVariation,
    desc: "Variable font axis setting for normal text. Format: 'AXIS=value' (e.g. 'wght=500'). Can be repeated for multiple axes.",
  },
  {
    key: "font-variation-bold",
    schema: fontVariation,
    desc: "Variable font axis setting for bold text. Format: 'AXIS=value'. Can be repeated for multiple axes.",
  },
  {
    key: "font-variation-italic",
    schema: fontVariation,
    desc: "Variable font axis setting for italic text. Format: 'AXIS=value'. Can be repeated for multiple axes.",
  },
  {
    key: "font-variation-bold-italic",
    schema: fontVariation,
    desc: "Variable font axis setting for bold italic text. Format: 'AXIS=value'. Can be repeated for multiple axes.",
  },

  {
    key: "font-codepoint-map",
    schema: fontCodepointMap,
    desc: "Maps one or more Unicode codepoint ranges to a named font. Format: 'U+ABCD=FontName' or 'U+ABCD-U+DEFG=FontName'. Multiple ranges can be comma-separated before '='.",
    comma: true,
  },
  {
    key: "clipboard-codepoint-map",
    schema: clipboardCodepointMap,
    desc: "Maps a pasted clipboard codepoint or range to a replacement value. Format: 'U+ABCD=replacement'.",
  },

  {
    key: "font-thicken",
    schema: z.boolean(),
    default: false,
    desc: "Enables font thickening for better legibility on some displays. macOS only.",
  },
  {
    key: "font-thicken-strength",
    schema: z.number().int().min(0).max(255),
    desc: "Strength of font thickening (0–255) when font-thicken is enabled. macOS only.",
  },

  {
    key: "font-shaping-break",
    schema: z.string().regex(/^(no-)?cursor(,(no-)?cursor)*$/),
    default: "cursor",
    desc: "Where Ghostty breaks font shaping runs, preventing ligatures from forming across the break. 'cursor' breaks at the cursor position. Prefix with 'no-' to disable. Multiple values can be comma-separated.",
    comma: true,
  },

  {
    key: "alpha-blending",
    schema: z.enum(["native", "linear", "linear-corrected"]),
    default: "native",
    desc: "Alpha blending algorithm for rendering transparent backgrounds. 'native': platform default; 'linear': blend in linear light; 'linear-corrected': linear with gamma correction.",
  },

  // ── Adjust ────────────────────────────────────────────────────────────────
  {
    key: "adjust-cell-width",
    schema: pixelOrPercent,
    default: 0,
    desc: "Adjust terminal cell width. Accepts an integer (pixels) or percentage string (e.g. '20%', '-15%'). Additive to the font-derived metric.",
  },
  {
    key: "adjust-cell-height",
    schema: pixelOrPercent,
    default: 0,
    desc: "Adjust terminal cell height. Accepts an integer or percentage. The font is centered vertically in the adjusted cell.",
  },
  {
    key: "adjust-font-baseline",
    schema: pixelOrPercent,
    default: 0,
    desc: "Adjust the font baseline position within the cell. Accepts an integer or percentage.",
  },
  {
    key: "adjust-underline-position",
    schema: pixelOrPercent,
    default: 0,
    desc: "Adjust underline vertical position. Accepts an integer or percentage.",
  },
  {
    key: "adjust-underline-thickness",
    schema: pixelOrPercent,
    default: 0,
    desc: "Adjust underline thickness. Accepts an integer or percentage. Cannot go below 1px minimum.",
  },
  {
    key: "adjust-strikethrough-position",
    schema: pixelOrPercent,
    default: 0,
    desc: "Adjust strikethrough vertical position. Accepts an integer or percentage.",
  },
  {
    key: "adjust-strikethrough-thickness",
    schema: pixelOrPercent,
    default: 0,
    desc: "Adjust strikethrough thickness. Accepts an integer or percentage. Cannot go below 1px minimum.",
  },
  {
    key: "adjust-overline-position",
    schema: pixelOrPercent,
    default: 0,
    desc: "Adjust overline vertical position. Accepts an integer or percentage.",
  },
  {
    key: "adjust-overline-thickness",
    schema: pixelOrPercent,
    default: 0,
    desc: "Adjust overline thickness. Accepts an integer or percentage. Cannot go below 1px minimum.",
  },
  {
    key: "adjust-cursor-thickness",
    schema: pixelOrPercent,
    default: 0,
    desc: "Adjust bar/underline cursor thickness. Accepts an integer or percentage.",
  },
  {
    key: "adjust-cursor-height",
    schema: pixelOrPercent,
    default: 0,
    desc: "Adjust cursor height. Accepts an integer or percentage.",
  },
  {
    key: "adjust-box-thickness",
    schema: pixelOrPercent,
    default: 0,
    desc: "Adjust box drawing character line thickness. Accepts an integer or percentage.",
  },
  {
    key: "adjust-icon-height",
    schema: pixelOrPercent,
    desc: "Adjust maximum height for Nerd Font icons. Default is 1.2× capital letter height. Accepts an integer or percentage (e.g. '-16.6%'). Available since 1.2.0.",
  },

  {
    key: "grapheme-width-method",
    schema: z.enum(["legacy", "unicode"]),
    default: "unicode",
    desc: "Method for calculating grapheme cluster cell width. 'unicode': follows the Unicode standard; 'legacy': wcswidth-style calculation for compatibility with older programs.",
  },
  {
    key: "freetype-load-flags",
    schema: z.union([
      z.boolean(),
      z.enum([
        "hinting",
        "force-autohint",
        "monochrome",
        "autohint",
        "light",
        "no-hinting",
        "no-force-autohint",
        "no-monochrome",
        "no-autohint",
        "no-light",
      ]),
    ]),
    default: true,
    desc: "FreeType font loading/hinting flags for Linux rendering. Use true/false for defaults/none, or specify individual flags. Multiple flags can be combined with commas.",
    comma: true,
  },

  // ── Theme / Colors ────────────────────────────────────────────────────────
  {
    key: "theme",
    schema: z.string(),
    desc: "Named Ghostty color theme to load. Supports separate light/dark themes via 'dark:<name>,light:<name>' syntax.",
  },
  {
    key: "background",
    schema: hexOrNamedColor,
    default: "282c34",
    desc: "Terminal background color. Accepts a hex color (#RRGGBB or RRGGBB) or a named X11 color.",
  },
  {
    key: "foreground",
    schema: hexOrNamedColor,
    default: "ffffff",
    desc: "Terminal foreground (text) color. Accepts a hex color (#RRGGBB or RRGGBB) or a named X11 color.",
  },

  {
    key: "background-image",
    schema: pathLike,
    desc: "Path to an image file to display as the terminal background. Available since Ghostty 1.2.0.",
  },
  {
    key: "background-image-opacity",
    schema: z.number().min(0),
    default: 1.0,
    desc: "Opacity of the background image. Values above 1.0 boost image opacity relative to background-opacity. Available since Ghostty 1.2.0.",
  },
  {
    key: "background-image-position",
    schema: z.enum([
      "top-left",
      "top-center",
      "top-right",
      "center-left",
      "center",
      "center-right",
      "bottom-left",
      "bottom-center",
      "bottom-right",
    ]),
    default: "center",
    desc: "Placement of the background image within the terminal window. Available since Ghostty 1.2.0.",
  },
  {
    key: "background-image-fit",
    schema: z.enum(["contain", "cover", "stretch", "none"]),
    default: "contain",
    desc: "How the background image is scaled. 'contain': fit preserving aspect ratio; 'cover': fill potentially clipping; 'stretch': fill ignoring aspect ratio; 'none': original size. Available since Ghostty 1.2.0.",
  },
  {
    key: "background-image-repeat",
    schema: z.boolean(),
    default: false,
    desc: "Whether the background image tiles to fill the terminal area. Available since Ghostty 1.2.0.",
  },

  {
    key: "selection-foreground",
    schema: colorValue,
    desc: "Foreground color for selected text. Also accepts 'cell-foreground' or 'cell-background' to match the cell's colors dynamically (since 1.2.0).",
  },
  {
    key: "selection-background",
    schema: colorValue,
    desc: "Background color for selected text. Also accepts 'cell-foreground' or 'cell-background' to match the cell's colors dynamically (since 1.2.0).",
  },
  {
    key: "selection-clear-on-typing",
    schema: z.boolean(),
    default: true,
    desc: "Whether the active selection is cleared when typing.",
  },
  {
    key: "selection-clear-on-copy",
    schema: z.boolean(),
    default: false,
    desc: "Whether the selection is cleared after copying via copy_to_clipboard. Does not apply to copy-on-select.",
  },
  {
    key: "selection-word-chars",
    schema: z.string(),
    desc: "Extra characters treated as word constituents when double-clicking to select a word.",
  },

  {
    key: "minimum-contrast",
    schema: z.number().min(1).max(21),
    default: 1,
    desc: "Minimum WCAG 2.0 contrast ratio (1–21) between foreground and background colors. Higher values ensure legibility but may force text black or white.",
  },
  {
    key: "palette",
    schema: z.string().regex(/^(1[0-5]|[0-9])=#[0-9a-fA-F]{6}$/),
    desc: "Sets one of the 16 ANSI terminal palette colors. Format: '<index>=<#RRGGBB>' where index is 0–15. Additive — each line sets one color entry.",
  },
  {
    key: "palette-generate",
    schema: z.boolean(),
    default: false,
    desc: "When true, auto-generates the 16-color palette from the configured background and foreground colors.",
  },
  {
    key: "palette-harmonious",
    schema: z.boolean(),
    default: false,
    desc: "When true, adjusts palette colors to be more harmonious with the configured background and foreground.",
  },

  {
    key: "cursor-color",
    schema: colorValue,
    desc: "Terminal cursor color. Accepts hex (#RRGGBB or RRGGBB) or a named X11 color.",
  },
  {
    key: "cursor-opacity",
    schema: opacity01,
    default: 1.0,
    desc: "Opacity of the terminal cursor (0–1).",
  },
  {
    key: "cursor-style",
    schema: z.enum(["block", "bar", "underline", "block_hollow"]),
    default: "block",
    desc: "Visual style of the terminal cursor. Programs can override this via DECSCUSR.",
  },
  {
    key: "cursor-style-blink",
    schema: z.boolean().nullable().optional(),
    desc: "Default blinking state of the cursor. When unset, respects DEC Mode 12. When explicitly set, DEC Mode 12 is ignored.",
  },
  {
    key: "cursor-text",
    schema: colorValue,
    desc: "Color of text drawn under the cursor. Also accepts 'cell-foreground' or 'cell-background' (since 1.2.0).",
  },
  {
    key: "cursor-click-to-move",
    schema: z.boolean(),
    default: true,
    desc: "Allows repositioning the cursor via alt+click (option+click on macOS) at shell prompts. Requires shell integration.",
  },

  {
    key: "mouse-hide-while-typing",
    schema: z.boolean(),
    default: false,
    desc: "Hides the mouse cursor while typing. Reappears on mouse movement.",
  },
  {
    key: "scroll-to-bottom",
    schema: z.union([
      z.boolean(),
      z.enum(["keystroke", "no-keystroke", "output", "no-output"]),
    ]),
    default: "keystroke",
    desc: "Controls when the terminal auto-scrolls to the bottom. Comma-separated flags: 'keystroke' scrolls on key presses to PTY; 'output' scrolls on new output. Prefix with 'no-' to disable.",
    comma: true,
  },
  {
    key: "mouse-shift-capture",
    schema: z.union([z.boolean(), z.enum(["always", "never"])]),
    default: false,
    desc: "Controls Shift+click behavior. false/true allow program override via XTSHIFTESCAPE; 'never'/'always' prevent program override.",
  },
  {
    key: "mouse-reporting",
    schema: z.boolean(),
    default: false,
    desc: "Enables mouse reporting to running programs. Programs can also toggle this via escape sequences.",
  },
  {
    key: "mouse-scroll-multiplier",
    schema: z.number().min(0.01).max(10000),
    default: 3,
    desc: "Multiplier for mouse wheel scrolling distance. Default 3 scrolls 3 lines per wheel tick.",
  },

  {
    key: "background-opacity",
    schema: opacity01,
    default: 1.0,
    desc: "Opacity of the terminal window background (0–1). Values below 1 enable transparency. Pair with background-blur for a frosted-glass effect.",
  },
  {
    key: "background-opacity-cells",
    schema: z.boolean(),
    default: false,
    desc: "When true, applies background-opacity to cells with an explicit background color set (useful for Neovim, Tmux).",
  },
  {
    key: "background-blur",
    schema: z.number().nonnegative(),
    default: 0,
    desc: "Background blur radius when background-opacity < 1. 0 disables blur. Platform support varies.",
  },
  {
    key: "unfocused-split-opacity",
    schema: z.number().min(0.15).max(1),
    desc: "Opacity of unfocused terminal splits (0.15–1) to visually distinguish the active split.",
  },
  {
    key: "unfocused-split-fill",
    schema: hexOrNamedColor,
    desc: "Color of the overlay used to dim unfocused splits. Defaults to the terminal background color.",
  },
  {
    key: "split-divider-color",
    schema: hexOrNamedColor,
    desc: "Color of dividers between split terminal panes.",
  },
  {
    key: "split-preserve-zoom",
    schema: z.boolean(),
    default: false,
    desc: "When true, creating a new split preserves the zoom state of the current split rather than unzooming.",
  },

  {
    key: "search-foreground",
    schema: hexOrNamedColor,
    desc: "Foreground color for search match highlights.",
  },
  {
    key: "search-background",
    schema: hexOrNamedColor,
    desc: "Background color for search match highlights.",
  },
  {
    key: "search-selected-foreground",
    schema: hexOrNamedColor,
    desc: "Foreground color for the active (currently selected) search match.",
  },
  {
    key: "search-selected-background",
    schema: hexOrNamedColor,
    desc: "Background color for the active (currently selected) search match.",
  },

  // ── Command / Env ─────────────────────────────────────────────────────────
  {
    key: "command",
    schema: commandLike,
    desc: "Shell or command to run in each terminal surface. Defaults to the SHELL environment variable or the user's shell from /etc/passwd.",
  },
  {
    key: "initial-command",
    schema: commandLike,
    desc: "Like 'command', but applies only to the first terminal surface. Also set via 'ghostty -e <args>'.",
  },
  {
    key: "notify-on-command-finish",
    schema: z.enum(["never", "unfocused", "always"]),
    default: "unfocused",
    desc: "When to send a notification after a command finishes. 'unfocused': only when the window is not focused.",
  },
  {
    key: "notify-on-command-finish-action",
    schema: z.enum(["bell", "notify", "no-bell", "no-notify"]),
    desc: "Action(s) when notify-on-command-finish fires. 'bell': ring the terminal bell; 'notify': desktop notification. Multiple values can be comma-separated.",
    comma: true,
  },
  {
    key: "notify-on-command-finish-after",
    schema: durationString,
    desc: "Minimum command runtime before notify-on-command-finish fires (e.g. '500ms', '1s').",
  },

  {
    key: "env",
    schema: envAssignment,
    desc: "Extra environment variable for terminal surfaces in KEY=VALUE format. Set KEY= to remove a var, or env = to reset all. Additive.",
  },
  {
    key: "input",
    schema: pathLike,
    desc: "Data to write to the pty before user input. Format: 'raw:<string>' or 'path:<file>'. Additive — values are concatenated.",
  },
  {
    key: "wait-after-command",
    schema: z.boolean(),
    default: false,
    desc: "When true, the window remains open after the command exits until any key is pressed.",
  },
  {
    key: "abnormal-command-exit-runtime",
    schema: z.number().int().nonnegative(),
    desc: "Runtime threshold (ms) below which a non-zero exit is treated as abnormal. 0 disables the check.",
  },
  {
    key: "scrollback-limit",
    schema: z.number().int().nonnegative(),
    default: 10000,
    desc: "Maximum scrollback buffer lines. 0 disables scrollback entirely. Per-surface limit.",
  },

  {
    key: "scrollbar",
    schema: z.enum(["system", "always", "never"]),
    default: "system",
    desc: "Scrollbar visibility. 'system': follows platform conventions.",
  },

  {
    key: "link",
    schema: z.boolean(),
    default: true,
    desc: "Enables automatic hyperlink detection in terminal output.",
  },
  {
    key: "link-url",
    schema: z.boolean(),
    default: true,
    desc: "Enables detection and highlighting of URL patterns as clickable links.",
  },
  {
    key: "link-previews",
    schema: z.boolean(),
    default: true,
    desc: "Shows a preview tooltip when hovering over detected links.",
  },

  // ── Window ────────────────────────────────────────────────────────────────
  {
    key: "maximize",
    schema: z.boolean(),
    default: false,
    desc: "Start the window in a maximized state.",
  },
  {
    key: "fullscreen",
    schema: z.boolean(),
    default: false,
    desc: "Start the window in fullscreen mode.",
  },
  {
    key: "title",
    schema: z.string(),
    desc: "Override the default window title. Applications can still change the title via OSC 2.",
  },
  {
    key: "class",
    schema: z.string(),
    default: "com.mitchellh.ghostty",
    desc: "Sets WM_CLASS on X11/Wayland and the GTK application ID.",
  },
  {
    key: "x11-instance-name",
    schema: z.string(),
    default: "ghostty",
    desc: "X11 WM_CLASS instance name (first component). X11 builds only.",
  },
  {
    key: "working-directory",
    schema: z.union([z.enum(["home", "inherit"]), z.string()]),
    default: "home",
    desc: "Initial working directory. 'home': user's home directory; 'inherit': parent process cwd; or an absolute path.",
  },

  {
    key: "keybind",
    schema: keybindLike,
    desc: "Custom key binding rule. Format: '<mods>+<key>=<action>'. Use 'keybind = clear' to remove all defaults. Additive.",
  },
  {
    key: "key-remap",
    schema: keyRemapLike,
    desc: "Keyboard remapping rule. Format: '<from>=<to>'. Processed before keybind rules.",
  },

  {
    key: "window-padding-x",
    schema: z.union([z.number(), z.string().regex(/^\d+,\d+$/)]),
    default: 2,
    desc: "Horizontal padding inside the window in points. Single value for both sides; 'left,right' for asymmetric padding.",
  },
  {
    key: "window-padding-y",
    schema: z.union([z.number(), z.string().regex(/^\d+,\d+$/)]),
    default: 2,
    desc: "Vertical padding inside the window in points. Single value for both sides; 'top,bottom' for asymmetric padding.",
  },
  {
    key: "window-padding-balance",
    schema: z.boolean(),
    default: false,
    desc: "When true, distributes leftover pixel space evenly as additional padding rather than leaving it at the right/bottom edge.",
  },
  {
    key: "window-padding-color",
    schema: z.union([
      z.enum(["background", "extend", "extend-always"]),
      hexOrNamedColor,
    ]),
    default: "background",
    desc: "Color of the padding area. 'background': terminal background; 'extend': extends nearest cell color; 'extend-always': always extends even with program-set backgrounds.",
  },
  {
    key: "window-vsync",
    schema: z.boolean(),
    default: true,
    desc: "Enables vertical sync for the terminal renderer. Disabling may reduce latency at the cost of tearing.",
  },

  {
    key: "window-inherit-working-directory",
    schema: z.boolean(),
    default: true,
    desc: "New windows and tabs inherit the working directory of the focused window.",
  },
  {
    key: "tab-inherit-working-directory",
    schema: z.boolean(),
    desc: "New tabs inherit the working directory of the focused tab.",
  },
  {
    key: "split-inherit-working-directory",
    schema: z.boolean(),
    desc: "New splits inherit the working directory of the focused split.",
  },
  {
    key: "window-inherit-font-size",
    schema: z.boolean(),
    default: true,
    desc: "New windows and tabs inherit the font size of the focused window.",
  },

  {
    key: "window-decoration",
    schema: z.enum(["false", "none", "true", "auto", "client", "server"]),
    default: "auto",
    desc: "Window decorations (title bar, borders). 'auto': platform default; 'none': remove decorations; 'client': client-side; 'server': server-side. 'true'/'false' are aliases for 'auto'/'none'.",
  },
  {
    key: "window-title-font-family",
    schema: z.string(),
    desc: "Font family for window and tab title bars. Any system font; does not need to be monospace.",
  },
  {
    key: "window-subtitle",
    schema: z.string(),
    desc: "Subtitle shown below the main window title where the platform supports it.",
  },
  {
    key: "window-theme",
    schema: z.enum(["auto", "system", "light", "dark", "ghostty"]),
    default: "auto",
    desc: "Window chrome color theme. 'auto': matches system appearance; 'ghostty': derived from the terminal background color.",
  },
  {
    key: "window-colorspace",
    schema: z.enum(["srgb", "display-p3"]),
    default: "srgb",
    desc: "Color space for terminal rendering. 'display-p3' enables wide-gamut color on supported displays (macOS only).",
  },
  {
    key: "window-height",
    schema: z.number().int().nonnegative(),
    default: 0,
    desc: "Initial window height in terminal grid rows. 0 uses the platform/system default.",
  },
  {
    key: "window-width",
    schema: z.number().int().nonnegative(),
    default: 0,
    desc: "Initial window width in terminal grid columns. 0 uses the platform/system default.",
  },
  {
    key: "window-position-x",
    schema: z.number().int(),
    desc: "Initial window X position in screen pixels.",
  },
  {
    key: "window-position-y",
    schema: z.number().int(),
    desc: "Initial window Y position in screen pixels.",
  },
  {
    key: "window-save-state",
    schema: z.enum(["default", "never", "always"]),
    default: "default",
    desc: "Controls saving and restoring window state (size, position). 'default': follows platform behavior.",
  },
  {
    key: "window-step-resize",
    schema: z.boolean(),
    default: false,
    desc: "When true, window resizing snaps to terminal cell boundaries.",
  },
  {
    key: "window-new-tab-position",
    schema: z.enum(["current", "end"]),
    default: "current",
    desc: "Where newly opened tabs are inserted. 'current': after the active tab; 'end': at the last position.",
  },
  {
    key: "window-show-tab-bar",
    schema: z.enum(["always", "auto", "never"]),
    default: "auto",
    desc: "Tab bar visibility. 'auto': shows only when more than one tab is open.",
  },
  {
    key: "window-titlebar-background",
    schema: hexOrNamedColor,
    desc: "Background color of the window titlebar on GTK.",
  },
  {
    key: "window-titlebar-foreground",
    schema: hexOrNamedColor,
    desc: "Foreground (text/icon) color of the window titlebar on GTK.",
  },

  {
    key: "resize-overlay",
    schema: z.enum(["always", "never", "after-first"]),
    default: "after-first",
    desc: "Shows a size overlay while resizing. 'after-first': for all resizes except the initial window creation.",
  },
  {
    key: "resize-overlay-position",
    schema: z.enum([
      "center",
      "top-left",
      "top-center",
      "top-right",
      "bottom-left",
      "bottom-center",
      "bottom-right",
    ]),
    default: "center",
    desc: "Screen position of the resize size overlay.",
  },
  {
    key: "resize-overlay-duration",
    schema: durationString,
    default: "750ms",
    desc: "How long the resize overlay stays visible after the last resize event.",
  },

  {
    key: "focus-follows-mouse",
    schema: z.boolean(),
    default: false,
    desc: "When true, focus follows mouse hover within Ghostty split panes.",
  },

  // ── Clipboard ─────────────────────────────────────────────────────────────
  {
    key: "clipboard-read",
    schema: z.enum(["ask", "allow", "deny"]),
    default: "ask",
    desc: "Permission for applications to read from the clipboard via OSC 52. 'ask': prompts the user each time.",
  },
  {
    key: "clipboard-write",
    schema: z.enum(["ask", "allow", "deny"]),
    default: "allow",
    desc: "Permission for applications to write to the clipboard via OSC 52.",
  },
  {
    key: "clipboard-trim-trailing-spaces",
    schema: z.boolean(),
    default: true,
    desc: "When true, trailing whitespace is stripped from text copied to the clipboard.",
  },
  {
    key: "clipboard-paste-protection",
    schema: z.boolean(),
    default: true,
    desc: "When true, detects potentially dangerous paste content and prompts for confirmation.",
  },
  {
    key: "clipboard-paste-bracketed-safe",
    schema: z.boolean(),
    default: true,
    desc: "When true, content pasted via bracketed paste mode bypasses clipboard-paste-protection checks.",
  },

  {
    key: "title-report",
    schema: z.boolean(),
    default: false,
    desc: "When true, allows applications to query the terminal's current title via OSC escape sequences.",
  },
  {
    key: "image-storage-limit",
    schema: z.number().int().nonnegative(),
    default: 320000000,
    desc: "Maximum bytes used to cache images displayed via Kitty graphics protocol or sixel. Default is ~320 MB.",
  },
  {
    key: "copy-on-select",
    schema: z.union([z.boolean(), z.literal("clipboard")]),
    default: "clipboard",
    desc: "Automatically copies selected text. true: to selection clipboard (primary on Linux); 'clipboard': also to system clipboard; false: disables auto-copy.",
  },
  {
    key: "right-click-action",
    schema: z.enum([
      "context-menu",
      "paste",
      "copy",
      "copy-or-paste",
      "ignore",
    ]),
    default: "context-menu",
    desc: "Action performed on right-click. 'copy-or-paste': copies if text is selected, otherwise pastes.",
  },
  {
    key: "click-repeat-interval",
    schema: durationString,
    desc: "Interval for repeated click detection (double-click, triple-click). If unset, uses the platform default.",
  },

  {
    key: "config-file",
    schema: pathLike,
    desc: "Path to an additional config file to load. Config files load in order; later values override earlier. Additive.",
  },
  {
    key: "config-default-files",
    schema: z.boolean(),
    default: true,
    desc: "When false, default config file locations are not loaded automatically.",
  },

  {
    key: "confirm-close-surface",
    schema: z.union([z.boolean(), z.literal("always")]),
    default: true,
    desc: "Whether to confirm before closing a terminal with a running process. true: prompts when process is running; 'always': always prompts; false: never prompts.",
  },

  {
    key: "quit-after-last-window-closed",
    schema: z.boolean(),
    desc: "Quit the application after the last window closes. Default is true on Linux, false on macOS.",
  },
  {
    key: "quit-after-last-window-closed-delay",
    schema: durationString,
    desc: "Duration to wait before quitting after the last window closes. Only effective when quit-after-last-window-closed is true.",
  },

  {
    key: "initial-window",
    schema: z.boolean(),
    default: true,
    desc: "Whether to create an initial window at startup. Setting to false runs Ghostty as a background service.",
  },
  {
    key: "undo-timeout",
    schema: durationString,
    default: "10s",
    desc: "How long undoable actions (e.g. closing a tab) remain reversible. macOS only.",
  },

  // ── Quick Terminal ────────────────────────────────────────────────────────
  {
    key: "quick-terminal-position",
    schema: z.enum(["top", "bottom", "left", "right", "center"]),
    default: "top",
    desc: "Edge or position where the quick (drop-down/Quake-style) terminal appears.",
  },
  {
    key: "quick-terminal-size",
    schema: z.string().regex(/^\d+(?:\.\d+)?%$/),
    default: "50%",
    desc: "Size of the quick terminal as a percentage of the screen dimension in the direction it slides from.",
  },
  {
    key: "gtk-quick-terminal-layer",
    schema: z.enum(["overlay", "top", "bottom", "background"]),
    default: "overlay",
    desc: "Wayland layer-shell layer used by the quick terminal on GTK. 'overlay' renders above all windows.",
  },
  {
    key: "gtk-quick-terminal-namespace",
    schema: z.string(),
    desc: "Namespace identifier for the quick terminal window on Wayland, used by the compositor. GTK/Wayland only.",
  },
  {
    key: "quick-terminal-screen",
    schema: z.enum(["main", "mouse", "macos-menu-bar"]),
    default: "main",
    desc: "Which screen the quick terminal appears on. 'mouse': screen under the mouse cursor; 'macos-menu-bar': screen with the macOS menu bar.",
  },
  {
    key: "quick-terminal-animation-duration",
    schema: durationString,
    default: "200ms",
    desc: "Duration of the slide animation when toggling the quick terminal. Set to '0' to disable animation.",
  },
  {
    key: "quick-terminal-autohide",
    schema: z.boolean(),
    default: true,
    desc: "Automatically hides the quick terminal when it loses focus.",
  },
  {
    key: "quick-terminal-space-behavior",
    schema: z.enum(["move", "remain"]),
    default: "remain",
    desc: "Controls whether the quick terminal follows to a new macOS Space ('move') or stays on the Space where it was opened ('remain').",
  },
  {
    key: "quick-terminal-keyboard-interactivity",
    schema: z.enum(["none", "on-demand", "exclusive"]),
    default: "on-demand",
    desc: "Controls when the quick terminal receives keyboard input. Primarily affects Linux Wayland. Available since v1.2.0.",
  },

  // ── Shell Integration ─────────────────────────────────────────────────────
  {
    key: "shell-integration",
    schema: z.enum([
      "none",
      "detect",
      "bash",
      "elvish",
      "fish",
      "nushell",
      "zsh",
    ]),
    default: "detect",
    desc: "Shell integration injection mode. 'detect': auto-detect the shell; a specific shell name forces injection; 'none': disable injection entirely.",
  },
  {
    key: "shell-integration-features",
    schema: z.union([
      z.boolean(),
      z.enum([
        "cursor",
        "sudo",
        "title",
        "ssh-env",
        "ssh-terminfo",
        "path",
        "no-cursor",
        "no-sudo",
        "no-title",
        "no-ssh-env",
        "no-ssh-terminfo",
        "no-path",
      ]),
    ]),
    default: "cursor,sudo,title",
    desc: "Shell integration sub-features to enable. Use true/false for all on/off, or a comma-separated list. Features: cursor, sudo, title, ssh-env, ssh-terminfo, path. Prefix with 'no-' to disable.",
    comma: true,
  },
  {
    key: "command-palette-entry",
    schema: z.string(),
    desc: "Custom command palette entry. Format: 'title:My Action,action:csi:0m'. Additive. Set to empty string to clear defaults. Available since v1.2.0.",
  },
  {
    key: "osc-color-report-format",
    schema: z.enum(["none", "8-bit", "16-bit"]),
    default: "16-bit",
    desc: "Bit-depth format for OSC color query responses. 'none': disable reporting; '8-bit': 8-bit per channel; '16-bit': 16-bit per channel (most compatible).",
  },
  {
    key: "vt-kam-allowed",
    schema: z.boolean(),
    default: false,
    desc: "Whether to allow VT Keyboard Action Mode (KAM), which suppresses keyboard input. Disabled by default for security.",
  },

  {
    key: "custom-shader",
    schema: shaderPath,
    desc: "Path to a custom GLSL fragment shader for post-processing effects. Can be repeated (additive) to stack shaders.",
  },
  {
    key: "custom-shader-animation",
    schema: z.enum(["true", "false", "always"]),
    default: "false",
    desc: "Whether custom shaders receive continuous animation frames. 'true': only on content change; 'false': static; 'always': continuously.",
  },

  {
    key: "bell-features",
    schema: z.enum([
      "system",
      "audio",
      "attention",
      "title",
      "border",
      "no-system",
      "no-audio",
      "no-attention",
      "no-title",
      "no-border",
    ]),
    default: "title,attention",
    desc: "Terminal bell features. Comma-separated: 'system': OS beep; 'audio': custom audio file (GTK); 'attention': dock/taskbar highlight; 'title': bell emoji in window title; 'border': flash window border. Prefix with 'no-' to disable.",
    comma: true,
  },
  {
    key: "bell-audio-path",
    schema: pathLike,
    desc: "Path to an audio file for bell sound. Requires 'audio' in bell-features. GTK only.",
  },
  {
    key: "bell-audio-volume",
    schema: z.number().min(0).max(1),
    default: 1.0,
    desc: "Volume of bell audio playback (0–1). GTK only.",
  },

  {
    key: "app-notifications",
    schema: z.enum(["clipboard-paste", "no-clipboard-paste"]),
    desc: "App-level notification types to enable or disable. 'clipboard-paste': shows banner on clipboard paste operations. Comma-separated.",
    comma: true,
  },

  // ── macOS ─────────────────────────────────────────────────────────────────
  {
    key: "macos-non-native-fullscreen",
    schema: z.union([z.boolean(), z.literal("visible-menu")]),
    default: false,
    desc: "Use non-native (custom) fullscreen on macOS. 'visible-menu': non-native fullscreen but keeps the menu bar visible.",
  },
  {
    key: "macos-window-buttons",
    schema: z.enum(["visible", "hidden", "macos-native"]),
    default: "visible",
    desc: "macOS traffic-light button (close/minimize/zoom) visibility and style.",
  },
  {
    key: "macos-titlebar-style",
    schema: z.enum(["native", "transparent", "tabs", "hidden"]),
    default: "transparent",
    desc: "macOS titlebar appearance. 'transparent': blends into terminal background; 'tabs': integrated tab bar; 'hidden': hides titlebar entirely.",
  },
  {
    key: "macos-titlebar-proxy-icon",
    schema: z.enum(["visible", "hidden"]),
    default: "visible",
    desc: "Visibility of the proxy icon (folder icon representing cwd) in the macOS titlebar. Only shown with 'native' titlebar style.",
  },
  {
    key: "macos-dock-drop-behavior",
    schema: z.enum(["new-tab", "new-window"]),
    default: "new-tab",
    desc: "Action when a file/folder is dropped onto the Ghostty Dock icon. 'new-tab': open in new tab; 'new-window': always open a new window.",
  },
  {
    key: "macos-option-as-alt",
    schema: z.union([z.boolean(), z.enum(["left", "right"])]),
    default: false,
    desc: "How the macOS Option key maps to Alt. true: both Option keys; false: standard macOS behavior; 'left'/'right': only that Option key.",
  },
  {
    key: "macos-window-shadow",
    schema: z.boolean(),
    default: true,
    desc: "Whether to show a drop shadow beneath Ghostty windows on macOS.",
  },
  {
    key: "macos-hidden",
    schema: z.boolean(),
    default: false,
    desc: "Start Ghostty hidden on macOS (not visible in the Dock). Useful for background service mode.",
  },
  {
    key: "macos-auto-secure-input",
    schema: z.boolean(),
    default: true,
    desc: "Automatically enables macOS Secure Input mode when a password prompt is detected.",
  },
  {
    key: "macos-secure-input-indication",
    schema: z.boolean(),
    default: true,
    desc: "Shows a visual indicator in the titlebar when macOS Secure Input mode is active.",
  },
  {
    key: "macos-applescript",
    schema: z.enum(["allow", "deny"]),
    default: "allow",
    desc: "Whether to allow AppleScript to control Ghostty on macOS.",
  },
  {
    key: "macos-icon",
    schema: z.enum([
      "official",
      "blueprint",
      "chalkboard",
      "retro",
      "custom",
      "custom-style",
    ]),
    default: "official",
    desc: "macOS app icon variant. 'official': default icon; 'blueprint'/'chalkboard'/'retro': artist variants; 'custom': user-provided image (requires macos-custom-icon); 'custom-style': custom colors on official icon layers.",
  },
  {
    key: "macos-custom-icon",
    schema: pathLike,
    desc: "Path to a custom image file for the macOS app icon. Required when macos-icon is 'custom'.",
  },
  {
    key: "macos-icon-frame",
    schema: z.enum(["aluminum", "beige", "plastic", "chrome"]),
    default: "aluminum",
    desc: "Frame material style for the custom-style macOS app icon. Required when macos-icon is 'custom-style'.",
  },
  {
    key: "macos-icon-ghost-color",
    schema: hexOrNamedColor,
    desc: "Color for the ghost element in the custom-style macOS app icon. Required when macos-icon is 'custom-style'.",
  },
  {
    key: "macos-icon-screen-color",
    schema: z.string().regex(/^([^,]+)(,[^,]+){0,63}$/),
    desc: "One or more comma-separated colors for the screen in the custom-style macOS app icon. Multiple colors create a gradient.",
    comma: true,
  },
  {
    key: "macos-shortcuts",
    schema: z.enum(["ask", "allow", "deny"]),
    default: "ask",
    desc: "Permission policy for macOS Global Shortcuts integration.",
  },

  // ── Linux ─────────────────────────────────────────────────────────────────
  {
    key: "linux-cgroup",
    schema: z.enum(["never", "always", "single-instance"]),
    default: "single-instance",
    desc: "Controls whether Ghostty places each terminal process into its own Linux cgroup. 'single-instance': only when running as a single instance.",
  },
  {
    key: "linux-cgroup-memory-limit",
    schema: z.number().int().nonnegative(),
    desc: "Soft memory limit (bytes) for each terminal process cgroup via memory.high. Unset means no limit.",
  },
  {
    key: "linux-cgroup-processes-limit",
    schema: z.number().int().nonnegative(),
    desc: "Hard limit on the number of processes for each terminal process cgroup via pids.max. Unset means no limit.",
  },
  {
    key: "linux-cgroup-hard-fail",
    schema: z.boolean(),
    default: false,
    desc: "When true, Ghostty exits with an error if cgroup setup fails rather than continuing without isolation.",
  },

  // ── GTK ───────────────────────────────────────────────────────────────────
  {
    key: "gtk-opengl-debug",
    schema: z.boolean(),
    default: false,
    desc: "Enables OpenGL debug output on GTK builds, printing GL errors to stderr. For development use.",
  },
  {
    key: "gtk-single-instance",
    schema: z.union([z.boolean(), z.literal("detect")]),
    default: "detect",
    desc: "Single-instance behavior on GTK/Linux. 'detect': auto-detect; true: always single-instance; false: allow multiple instances.",
  },
  {
    key: "gtk-titlebar",
    schema: z.boolean(),
    default: true,
    desc: "Whether to show the GTK client-side titlebar (CSD). Set to false to hide the titlebar.",
  },
  {
    key: "gtk-tabs-location",
    schema: z.enum(["top", "bottom", "hidden", "left", "right"]),
    default: "top",
    desc: "Location of the tab bar in the GTK window.",
  },
  {
    key: "gtk-titlebar-hide-when-maximized",
    schema: z.boolean(),
    default: false,
    desc: "Automatically hides the GTK titlebar when the window is maximized, reclaiming vertical space.",
  },
  {
    key: "gtk-toolbar-style",
    schema: z.enum(["raised", "raised-border", "flat"]),
    default: "flat",
    desc: "Visual style of the GTK toolbar/tab bar. 'flat': no border (default); 'raised': elevated shadow; 'raised-border': elevated with border.",
  },
  {
    key: "gtk-titlebar-style",
    schema: z.enum(["system", "primary", "flat"]),
    default: "system",
    desc: "Visual style of the GTK titlebar.",
  },
  {
    key: "gtk-wide-tabs",
    schema: z.boolean(),
    default: true,
    desc: "Whether GTK tabs expand to fill available horizontal space rather than being sized to their content.",
  },
  {
    key: "gtk-custom-css",
    schema: cssPath,
    desc: "Path to a custom CSS file for GTK theming. Can be specified multiple times (additive).",
  },

  {
    key: "desktop-notifications",
    schema: z.boolean(),
    default: true,
    desc: "Whether Ghostty is allowed to send desktop notifications (e.g. via OSC 9 or OSC 777).",
  },
  {
    key: "progress-style",
    schema: z.enum([
      "floating",
      "hidden",
      "dock",
      "no-floating",
      "no-hidden",
      "no-dock",
    ]),
    default: "floating",
    desc: "Progress indicator style(s). Comma-separated: 'floating': overlay in terminal; 'dock': taskbar/dock indicator; 'hidden': suppress display. Prefix with 'no-' to disable.",
    comma: true,
  },

  {
    key: "bold-color",
    schema: z.union([hexOrNamedColor, z.literal("bright")]),
    desc: "Color for bold text. 'bright': uses the bright variant of the configured foreground. If unset, bold text uses the same color as normal text.",
  },

  {
    key: "faint-opacity",
    schema: opacity01,
    default: 0.5,
    desc: "Opacity multiplier for faint/dim text (SGR attribute 2). Range 0–1; default 0.5.",
  },
  {
    key: "term",
    schema: z.string(),
    default: "xterm-ghostty",
    desc: "Value for the TERM environment variable inside the terminal. Change only if applications have compatibility issues with the Ghostty terminfo entry.",
  },
  {
    key: "enquiry-response",
    schema: z.string(),
    default: "",
    desc: "String sent in response to the terminal ENQ (Ctrl+E) control character. Empty string by default.",
  },

  {
    key: "async-backend",
    schema: z.enum(["auto", "epoll", "io_uring"]),
    default: "auto",
    desc: "Async I/O backend on Linux. 'auto': prefers io_uring with epoll fallback.",
  },

  {
    key: "auto-update",
    schema: z.enum(["off", "check", "download"]),
    desc: "Auto-update behavior on macOS. 'off': disable; 'check': notify only; 'download': auto-download. Linux uses system package managers.",
  },
  {
    key: "auto-update-channel",
    schema: z.enum(["stable", "tip"]),
    default: "stable",
    desc: "Release channel for auto-updates on macOS. 'tip': pre-release builds from main branch.",
  },
] as const;
