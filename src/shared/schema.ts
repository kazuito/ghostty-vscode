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

// const codepoint = /^U\+[0-9A-Fa-f]{4,6}$/;
// const codepointRange = /^U\+[0-9A-Fa-f]{4,6}-U\+[0-9A-Fa-f]{4,6}$/;

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

  "env",
]);

export const ghosttyConfigOptions = [
  {
    key: "language",
    schema: z.string(),
    desc: "UI/display language for Ghostty.",
  },

  {
    key: "font-family",
    schema: z.string(),
    desc: "Primary font family for normal text.",
  },
  {
    key: "font-family-bold",
    schema: z.string(),
    desc: "Font family for bold text.",
  },
  {
    key: "font-family-italic",
    schema: z.string(),
    desc: "Font family for italic text.",
  },
  {
    key: "font-family-bold-italic",
    schema: z.string(),
    desc: "Font family for bold italic text.",
  },

  {
    key: "font-style",
    schema: z.union([z.string(), z.literal(false)]),
    desc: "Preferred style name for the normal font face.",
  },
  {
    key: "font-style-bold",
    schema: z.union([z.string(), z.literal(false)]),
    desc: "Preferred style name for the bold font face.",
  },
  {
    key: "font-style-italic",
    schema: z.union([z.string(), z.literal(false)]),
    desc: "Preferred style name for the italic font face.",
  },
  {
    key: "font-style-bold-italic",
    schema: z.union([z.string(), z.literal(false)]),
    desc: "Preferred style name for the bold italic font face.",
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
    desc: "Controls synthetic bold/italic generation when real faces are unavailable.",
  },
  {
    key: "font-feature",
    schema: featureSetting,
    desc: "OpenType font feature overrides.",
  },
  { key: "font-size", schema: z.number(), desc: "Base terminal font size." },

  {
    key: "font-variation",
    schema: fontVariation,
    desc: "Variable font axis settings for normal text.",
  },
  {
    key: "font-variation-bold",
    schema: fontVariation,
    desc: "Variable font axis settings for bold text.",
  },
  {
    key: "font-variation-italic",
    schema: fontVariation,
    desc: "Variable font axis settings for italic text.",
  },
  {
    key: "font-variation-bold-italic",
    schema: fontVariation,
    desc: "Variable font axis settings for bold italic text.",
  },

  {
    key: "font-codepoint-map",
    schema: fontCodepointMap,
    desc: "Maps Unicode ranges to specific fonts.",
  },
  {
    key: "clipboard-codepoint-map",
    schema: clipboardCodepointMap,
    desc: "Maps pasted clipboard codepoints to replacements.",
  },

  {
    key: "font-thicken",
    schema: z.boolean(),
    desc: "Enables font thickening for rendering.",
  },
  {
    key: "font-thicken-strength",
    schema: z.number().int().min(0).max(255),
    desc: "Strength of font thickening effect.",
  },

  {
    key: "font-shaping-break",
    schema: z.string().regex(/^(no-)?cursor(,(no-)?cursor)*$/),
    desc: "Controls where shaping is broken during text layout.",
  },

  {
    key: "alpha-blending",
    schema: z.enum(["native", "linear", "linear-corrected"]),
    desc: "Alpha blending algorithm used for rendering.",
  },

  {
    key: "adjust-cell-width",
    schema: z.number(),
    desc: "Adjusts terminal cell width.",
  },
  {
    key: "adjust-cell-height",
    schema: z.number(),
    desc: "Adjusts terminal cell height.",
  },
  {
    key: "adjust-font-baseline",
    schema: z.number(),
    desc: "Adjusts font baseline position.",
  },
  {
    key: "adjust-underline-position",
    schema: z.number(),
    desc: "Adjusts underline vertical position.",
  },
  {
    key: "adjust-underline-thickness",
    schema: z.number(),
    desc: "Adjusts underline thickness.",
  },
  {
    key: "adjust-strikethrough-position",
    schema: z.number(),
    desc: "Adjusts strikethrough vertical position.",
  },
  {
    key: "adjust-strikethrough-thickness",
    schema: z.number(),
    desc: "Adjusts strikethrough thickness.",
  },
  {
    key: "adjust-overline-position",
    schema: z.number(),
    desc: "Adjusts overline vertical position.",
  },
  {
    key: "adjust-overline-thickness",
    schema: z.number(),
    desc: "Adjusts overline thickness.",
  },
  {
    key: "adjust-cursor-thickness",
    schema: z.number(),
    desc: "Adjusts bar/underline cursor thickness.",
  },
  {
    key: "adjust-cursor-height",
    schema: z.number(),
    desc: "Adjusts cursor height.",
  },
  {
    key: "adjust-box-thickness",
    schema: z.number(),
    desc: "Adjusts box drawing line thickness.",
  },
  {
    key: "adjust-icon-height",
    schema: z.number(),
    desc: "Adjusts icon glyph height.",
  },

  {
    key: "grapheme-width-method",
    schema: z.enum(["legacy", "unicode"]),
    desc: "Method used to determine grapheme width.",
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
    desc: "FreeType loading/rendering flags.",
  },

  { key: "theme", schema: z.string(), desc: "Named Ghostty theme to load." },
  {
    key: "background",
    schema: hexOrNamedColor,
    desc: "Default background color.",
  },
  {
    key: "foreground",
    schema: hexOrNamedColor,
    desc: "Default foreground color.",
  },

  {
    key: "background-image",
    schema: pathLike,
    desc: "Path to a background image.",
  },
  {
    key: "background-image-opacity",
    schema: opacity01,
    desc: "Opacity of the background image.",
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
    desc: "Placement of the background image.",
  },
  {
    key: "background-image-fit",
    schema: z.enum(["contain", "cover", "stretch", "none"]),
    desc: "Fit mode for the background image.",
  },
  {
    key: "background-image-repeat",
    schema: z.boolean(),
    desc: "Whether the background image repeats.",
  },

  {
    key: "selection-foreground",
    schema: hexOrNamedColor,
    desc: "Text color for selected text.",
  },
  {
    key: "selection-background",
    schema: hexOrNamedColor,
    desc: "Background color for selected text.",
  },
  {
    key: "selection-clear-on-typing",
    schema: z.boolean(),
    desc: "Clears selection when typing.",
  },
  {
    key: "selection-clear-on-copy",
    schema: z.boolean(),
    desc: "Clears selection after copying.",
  },
  {
    key: "selection-word-chars",
    schema: z.string(),
    desc: "Extra characters treated as part of a word for selection.",
  },

  {
    key: "minimum-contrast",
    schema: z.number(),
    desc: "Minimum text/background contrast target.",
  },
  {
    key: "palette",
    schema: z.string(),
    desc: "Terminal color palette override.",
  },
  {
    key: "palette-generate",
    schema: z.boolean(),
    desc: "Generates palette values automatically.",
  },
  {
    key: "palette-harmonious",
    schema: z.boolean(),
    desc: "Uses a more harmonious generated palette.",
  },

  { key: "cursor-color", schema: colorValue, desc: "Cursor color." },
  { key: "cursor-opacity", schema: opacity01, desc: "Cursor opacity." },
  {
    key: "cursor-style",
    schema: z.enum(["block", "bar", "underline", "block_hollow"]),
    desc: "Cursor shape.",
  },
  {
    key: "cursor-style-blink",
    schema: z.boolean().nullable().optional(),
    desc: "Whether the cursor blinks.",
  },
  {
    key: "cursor-text",
    schema: hexOrNamedColor,
    desc: "Text color shown under the cursor.",
  },
  {
    key: "cursor-click-to-move",
    schema: z.boolean(),
    desc: "Allows moving cursor via mouse click in supported apps.",
  },

  {
    key: "mouse-hide-while-typing",
    schema: z.boolean(),
    desc: "Hides mouse pointer while typing.",
  },
  {
    key: "scroll-to-bottom",
    schema: z.boolean(),
    desc: "Auto-scrolls to bottom on output/input events.",
  },
  {
    key: "mouse-shift-capture",
    schema: z.boolean(),
    desc: "Lets Shift affect mouse capture behavior.",
  },
  {
    key: "mouse-reporting",
    schema: z.boolean(),
    desc: "Enables terminal mouse reporting.",
  },
  {
    key: "mouse-scroll-multiplier",
    schema: z.number(),
    desc: "Multiplier applied to mouse wheel scrolling.",
  },

  {
    key: "background-opacity",
    schema: opacity01,
    desc: "Overall window background opacity.",
  },
  {
    key: "background-opacity-cells",
    schema: opacity01,
    desc: "Opacity for terminal cells themselves.",
  },
  {
    key: "background-blur",
    schema: z.number(),
    desc: "Background blur amount, if supported.",
  },
  {
    key: "unfocused-split-opacity",
    schema: opacity01,
    desc: "Opacity for unfocused split panes.",
  },
  {
    key: "unfocused-split-fill",
    schema: hexOrNamedColor,
    desc: "Fill color for unfocused splits.",
  },
  {
    key: "split-divider-color",
    schema: hexOrNamedColor,
    desc: "Color of split dividers.",
  },
  {
    key: "split-preserve-zoom",
    schema: z.boolean(),
    desc: "Keeps zoom state when splitting panes.",
  },

  {
    key: "search-foreground",
    schema: hexOrNamedColor,
    desc: "Foreground color for search matches.",
  },
  {
    key: "search-background",
    schema: hexOrNamedColor,
    desc: "Background color for search matches.",
  },
  {
    key: "search-selected-foreground",
    schema: hexOrNamedColor,
    desc: "Foreground color for selected search match.",
  },
  {
    key: "search-selected-background",
    schema: hexOrNamedColor,
    desc: "Background color for selected search match.",
  },

  { key: "command", schema: commandLike, desc: "Command or shell to launch." },
  {
    key: "initial-command",
    schema: commandLike,
    desc: "Command to run for the initial surface only.",
  },
  {
    key: "notify-on-command-finish",
    schema: z.enum(["never", "unfocused", "always"]),
    desc: "Shows a notification when a command finishes.",
  },
  {
    key: "notify-on-command-finish-action",
    schema: z.enum(["bell", "notify"]),
    desc: "Action used for command-finished notifications.",
  },
  {
    key: "notify-on-command-finish-after",
    schema: durationString,
    desc: "Minimum runtime before command-finished notifications trigger.",
  },

  {
    key: "env",
    schema: envAssignment,
    desc: "Environment variable assignment.",
  },
  { key: "input", schema: pathLike, desc: "Path to an input file or source." },
  {
    key: "wait-after-command",
    schema: z.boolean(),
    desc: "Keeps window open after command exits.",
  },
  {
    key: "abnormal-command-exit-runtime",
    schema: z.number().int().nonnegative(),
    desc: "Runtime threshold used to judge abnormal command exit behavior.",
  },
  {
    key: "scrollback-limit",
    schema: z.number().int().nonnegative(),
    desc: "Maximum scrollback buffer size.",
  },

  {
    key: "scrollbar",
    schema: z.enum(["system", "always", "never"]),
    desc: "Scrollbar visibility behavior.",
  },

  { key: "link", schema: z.boolean(), desc: "Enables link detection." },
  { key: "link-url", schema: z.boolean(), desc: "Enables URL link detection." },
  {
    key: "link-previews",
    schema: z.boolean(),
    desc: "Enables previews for detected links.",
  },

  {
    key: "maximize",
    schema: z.boolean(),
    desc: "Starts the window maximized.",
  },
  {
    key: "fullscreen",
    schema: z.boolean(),
    desc: "Starts the window fullscreen.",
  },
  { key: "title", schema: z.string(), desc: "Default window title." },
  { key: "class", schema: z.string(), desc: "Window class/app identifier." },
  {
    key: "x11-instance-name",
    schema: z.string(),
    desc: "X11 instance name override.",
  },
  {
    key: "working-directory",
    schema: pathLike,
    desc: "Initial working directory.",
  },

  { key: "keybind", schema: keybindLike, desc: "Custom key binding rule." },
  { key: "key-remap", schema: keyRemapLike, desc: "Keyboard remapping rule." },

  {
    key: "window-padding-x",
    schema: z.number(),
    desc: "Horizontal padding inside the window.",
  },
  {
    key: "window-padding-y",
    schema: z.number(),
    desc: "Vertical padding inside the window.",
  },
  {
    key: "window-padding-balance",
    schema: z.boolean(),
    desc: "Balances padding around the terminal area.",
  },
  {
    key: "window-padding-color",
    schema: hexOrNamedColor,
    desc: "Color used for window padding.",
  },
  {
    key: "window-vsync",
    schema: z.boolean(),
    desc: "Enables vertical sync for window rendering.",
  },

  {
    key: "window-inherit-working-directory",
    schema: z.boolean(),
    desc: "New windows inherit the current working directory.",
  },
  {
    key: "tab-inherit-working-directory",
    schema: z.boolean(),
    desc: "New tabs inherit the current working directory.",
  },
  {
    key: "split-inherit-working-directory",
    schema: z.boolean(),
    desc: "New splits inherit the current working directory.",
  },
  {
    key: "window-inherit-font-size",
    schema: z.boolean(),
    desc: "New windows inherit current font size.",
  },

  {
    key: "window-decoration",
    schema: z.enum(["false", "none", "true", "auto", "client", "server"]),
    desc: "Enables native window decorations.",
  },
  {
    key: "window-title-font-family",
    schema: z.string(),
    desc: "Font family used for titlebar text where supported.",
  },
  { key: "window-subtitle", schema: z.string(), desc: "Window subtitle text." },
  {
    key: "window-theme",
    schema: z.string(),
    desc: "Window chrome/theme style.",
  },
  {
    key: "window-colorspace",
    schema: z.string(),
    desc: "Colorspace used for window rendering.",
  },
  {
    key: "window-height",
    schema: z.number().int(),
    desc: "Initial window height.",
  },
  {
    key: "window-width",
    schema: z.number().int(),
    desc: "Initial window width.",
  },
  {
    key: "window-position-x",
    schema: z.number().int(),
    desc: "Initial window X position.",
  },
  {
    key: "window-position-y",
    schema: z.number().int(),
    desc: "Initial window Y position.",
  },
  {
    key: "window-save-state",
    schema: z.enum(["default", "never", "always"]),
    desc: "Saves and restores window state.",
  },
  {
    key: "window-step-resize",
    schema: z.boolean(),
    desc: "Resizes in terminal cell increments.",
  },
  {
    key: "window-new-tab-position",
    schema: z.enum(["current", "end"]),
    desc: "Placement of newly opened tabs.",
  },
  {
    key: "window-show-tab-bar",
    schema: z.enum(["always", "auto", "never"]),
    desc: "Shows the tab bar.",
  },
  {
    key: "window-titlebar-background",
    schema: hexOrNamedColor,
    desc: "Titlebar background color.",
  },
  {
    key: "window-titlebar-foreground",
    schema: hexOrNamedColor,
    desc: "Titlebar foreground color.",
  },

  {
    key: "resize-overlay",
    schema: z.enum(["always", "never", "after-first"]),
    desc: "Shows an overlay while resizing.",
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
    desc: "Position of the resize overlay.",
  },
  {
    key: "resize-overlay-duration",
    schema: durationString,
    desc: "How long the resize overlay stays visible.",
  },

  {
    key: "focus-follows-mouse",
    schema: z.boolean(),
    desc: "Moves focus based on mouse position.",
  },

  {
    key: "clipboard-read",
    schema: z.enum(["ask", "allow", "deny"]),
    desc: "Allows reading from the clipboard.",
  },
  {
    key: "clipboard-write",
    schema: z.enum(["ask", "allow", "deny"]),
    desc: "Allows writing to the clipboard.",
  },
  {
    key: "clipboard-trim-trailing-spaces",
    schema: z.boolean(),
    desc: "Trims trailing spaces on clipboard copy.",
  },
  {
    key: "clipboard-paste-protection",
    schema: z.boolean(),
    desc: "Enables paste protection checks.",
  },
  {
    key: "clipboard-paste-bracketed-safe",
    schema: z.boolean(),
    desc: "Treats bracketed paste as safe.",
  },

  {
    key: "title-report",
    schema: z.boolean(),
    desc: "Allows applications to query/report title state.",
  },
  {
    key: "image-storage-limit",
    schema: z.number().int().nonnegative(),
    desc: "Limit for terminal image storage/cache.",
  },
  {
    key: "copy-on-select",
    schema: z.boolean(),
    desc: "Copies selection automatically.",
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
    desc: "Action performed on right click.",
  },
  {
    key: "click-repeat-interval",
    schema: durationString,
    desc: "Interval used for repeated click actions.",
  },

  {
    key: "config-file",
    schema: pathLike,
    desc: "Additional config file path.",
  },
  {
    key: "config-default-files",
    schema: z.boolean(),
    desc: "Whether default config file locations are loaded.",
  },

  {
    key: "confirm-close-surface",
    schema: z.union([z.boolean(), z.literal("always")]),
    desc: "Whether to confirm before closing a surface.",
  },

  {
    key: "quit-after-last-window-closed",
    schema: z.boolean(),
    desc: "Quits app after the last window closes.",
  },
  {
    key: "quit-after-last-window-closed-delay",
    schema: durationString,
    desc: "Delay before quitting after the last window closes.",
  },

  {
    key: "initial-window",
    schema: z.boolean(),
    desc: "Controls creation/behavior of the initial window.",
  },
  {
    key: "undo-timeout",
    schema: durationString,
    desc: "Timeout for undoable actions.",
  },

  {
    key: "quick-terminal-position",
    schema: z.enum(["top", "bottom", "left", "right", "center"]),
    desc: "Position of the quick terminal.",
  },
  {
    key: "quick-terminal-size",
    schema: z.string(),
    desc: "Size of the quick terminal.",
  },
  {
    key: "gtk-quick-terminal-layer",
    schema: z.enum(["overlay", "top", "bottom", "background"]),
    desc: "Layer used by the GTK quick terminal.",
  },
  {
    key: "gtk-quick-terminal-namespace",
    schema: z.string(),
    desc: "Namespace used by the GTK quick terminal.",
  },
  {
    key: "quick-terminal-screen",
    schema: z.enum(["main", "mouse", "macos-menu-bar"]),
    desc: "Target screen/display for the quick terminal.",
  },
  {
    key: "quick-terminal-animation-duration",
    schema: durationString,
    desc: "Animation duration for quick terminal show/hide.",
  },
  {
    key: "quick-terminal-autohide",
    schema: z.boolean(),
    desc: "Automatically hides the quick terminal when focus is lost.",
  },
  {
    key: "quick-terminal-space-behavior",
    schema: z.enum(["move", "remain"]),
    desc: "Space/desktop behavior of the quick terminal.",
  },
  {
    key: "quick-terminal-keyboard-interactivity",
    schema: z.enum(["none", "on-demand", "exclusive"]),
    desc: "Allows keyboard interactivity for the quick terminal.",
  },

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
    desc: "Enables shell integration features.",
  },
  {
    key: "shell-integration-features",
    schema: z.enum([
      "true",
      "false",
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
    desc: "Specific shell integration features to enable.",
  },
  {
    key: "command-palette-entry",
    schema: z.string(),
    desc: "Adds a custom command palette entry.",
  },
  {
    key: "osc-color-report-format",
    schema: z.enum(["none", "8-bit", "16-bit"]),
    default: "16-bit",
    desc: "Format used for OSC color reporting.",
  },
  {
    key: "vt-kam-allowed",
    schema: z.boolean(),
    desc: "Allows VT keyboard action mode behavior.",
  },

  {
    key: "custom-shader",
    schema: shaderPath,
    desc: "Path to a custom shader file.",
  },
  {
    key: "custom-shader-animation",
    schema: z.enum(["true", "false", "always"]),
    desc: "Enables animation for custom shader rendering.",
  },

  {
    key: "bell-features",
    schema: z.enum([
      "system",
      "audio",
      "attention",
      "no-system",
      "no-audio",
      "no-attention",
    ]),
    desc: "Enabled terminal bell features.",
  },
  {
    key: "bell-audio-path",
    schema: pathLike,
    desc: "Path to an audio file for bell sound.",
  },
  {
    key: "bell-audio-volume",
    schema: z.number(),
    desc: "Volume of bell audio playback.",
  },

  {
    key: "app-notifications",
    schema: z.boolean(),
    desc: "Allows app-level notifications.",
  },

  {
    key: "macos-non-native-fullscreen",
    schema: z.boolean(),
    desc: "Uses non-native fullscreen behavior on macOS.",
  },
  {
    key: "macos-window-buttons",
    schema: z.string(),
    desc: "Controls macOS traffic-light window buttons.",
  },
  {
    key: "macos-titlebar-style",
    schema: z.string(),
    desc: "macOS titlebar appearance/style.",
  },
  {
    key: "macos-titlebar-proxy-icon",
    schema: z.boolean(),
    desc: "Shows the macOS proxy icon in the titlebar.",
  },
  {
    key: "macos-dock-drop-behavior",
    schema: z.string(),
    desc: "Behavior for files dropped onto the Dock icon.",
  },
  {
    key: "macos-option-as-alt",
    schema: z.string(),
    desc: "How macOS Option key maps to Alt behavior.",
  },
  {
    key: "macos-window-shadow",
    schema: z.boolean(),
    desc: "Enables macOS window shadow.",
  },
  {
    key: "macos-hidden",
    schema: z.boolean(),
    desc: "Starts the app hidden on macOS.",
  },
  {
    key: "macos-auto-secure-input",
    schema: z.boolean(),
    desc: "Automatically enables secure input on macOS.",
  },
  {
    key: "macos-secure-input-indication",
    schema: z.boolean(),
    desc: "Shows indication when secure input is enabled.",
  },
  {
    key: "macos-applescript",
    schema: z.boolean(),
    desc: "Enables AppleScript support/integration.",
  },
  {
    key: "macos-icon",
    schema: z.string(),
    desc: "Built-in macOS app icon variant.",
  },
  {
    key: "macos-custom-icon",
    schema: pathLike,
    desc: "Path to a custom macOS app icon.",
  },
  {
    key: "macos-icon-frame",
    schema: hexOrNamedColor,
    desc: "Frame color for generated macOS icon.",
  },
  {
    key: "macos-icon-ghost-color",
    schema: hexOrNamedColor,
    desc: "Ghost/logo color for generated macOS icon.",
  },
  {
    key: "macos-icon-screen-color",
    schema: z.string().regex(/^([^,]+)(,[^,]+){0,63}$/), // up to 64 comma-separated colors
    desc: "One or more screen colors for the generated macOS icon.",
  },
  {
    key: "macos-shortcuts",
    schema: z.enum(["ask", "allow", "deny"]),
    desc: "Permission policy for macOS shortcuts integration.",
  },

  {
    key: "linux-cgroup",
    schema: z.boolean(),
    desc: "Enables Linux cgroup support.",
  },
  {
    key: "linux-cgroup-memory-limit",
    schema: z.number().int().nonnegative(),
    desc: "Memory limit for Linux cgroup.",
  },
  {
    key: "linux-cgroup-processes-limit",
    schema: z.number().int().nonnegative(),
    desc: "Process count limit for Linux cgroup.",
  },
  {
    key: "linux-cgroup-hard-fail",
    schema: z.boolean(),
    desc: "Fails hard when Linux cgroup setup fails.",
  },

  {
    key: "gtk-opengl-debug",
    schema: z.boolean(),
    desc: "Enables GTK OpenGL debugging.",
  },
  {
    key: "gtk-single-instance",
    schema: z.boolean(),
    desc: "Uses single-instance behavior for GTK builds.",
  },
  {
    key: "gtk-titlebar",
    schema: z.boolean(),
    desc: "Uses GTK titlebar integration.",
  },
  {
    key: "gtk-tabs-location",
    schema: z.string(),
    desc: "Location of GTK tabs.",
  },
  {
    key: "gtk-titlebar-hide-when-maximized",
    schema: z.boolean(),
    desc: "Hides GTK titlebar when maximized.",
  },
  {
    key: "gtk-toolbar-style",
    schema: z.string(),
    desc: "GTK toolbar appearance/style.",
  },
  {
    key: "gtk-titlebar-style",
    schema: z.string(),
    desc: "GTK titlebar appearance/style.",
  },
  { key: "gtk-wide-tabs", schema: z.boolean(), desc: "Uses wide GTK tabs." },
  { key: "gtk-custom-css", schema: cssPath, desc: "Path to custom GTK CSS." },

  {
    key: "desktop-notifications",
    schema: z.boolean(),
    desc: "Enables desktop notifications.",
  },
  {
    key: "progress-style",
    schema: z.boolean(),
    desc: "Enables progress style/integration support.",
  },

  {
    key: "bold-color",
    schema: z.union([hexOrNamedColor, z.literal("bright")]),
    desc: "Color used for bold text.",
  },

  {
    key: "faint-opacity",
    schema: opacity01,
    desc: "Opacity used for faint text.",
  },
  { key: "term", schema: z.string(), desc: "TERM environment variable value." },
  {
    key: "enquiry-response",
    schema: z.string(),
    desc: "Response sent for terminal ENQ requests.",
  },

  {
    key: "async-backend",
    schema: z.enum(["auto", "epoll", "io_uring"]),
    desc: "Async I/O backend to use.",
  },

  {
    key: "auto-update",
    schema: z.enum(["off", "check", "download"]),
    desc: "Auto-update behavior.",
  },

  {
    key: "auto-update-channel",
    schema: z.enum(["stable", "tip"]),
    desc: "Update channel to follow.",
  },
] as const;
