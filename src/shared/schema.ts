import { z } from "zod";

const colorValue = z.union([
  z.string().regex(/^#?[0-9A-Fa-f]{6}$/), // hex or #hex
  z.enum(["cell-foreground", "cell-background"]).or(z.string()), // named X11 colors also allowed
]);

const hexOrNamedColor = z.union([
  z.string().regex(/^#?[0-9A-Fa-f]{6}$/),
  z.string(), // named X11 colors
]);

const opacity01 = z.number().min(0).max(1);

const codepoint = /^U\+[0-9A-Fa-f]{4,6}$/;
const codepointRange = /^U\+[0-9A-Fa-f]{4,6}-U\+[0-9A-Fa-f]{4,6}$/;

const fontVariation = z.string().regex(/^[A-Za-z0-9]{4}\s*=\s*-?\d+(?:\.\d+)?$/);
const fontCodepointMap = z.string().regex(
  /^((U\+[0-9A-Fa-f]{4,6}(?:-U\+[0-9A-Fa-f]{4,6})?)(,(U\+[0-9A-Fa-f]{4,6}(?:-U\+[0-9A-Fa-f]{4,6})?))*)=.+$/
);
const clipboardCodepointMap = z.string().regex(
  /^(U\+[0-9A-Fa-f]{4,6}(?:-U\+[0-9A-Fa-f]{4,6})?)=.+$/
);
const envAssignment = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*=.*/);
const pathLike = z.string();
const featureSetting = z.string(); // syntax is intentionally loose in docs
const keybindLike = z.string();
const keyRemapLike = z.string();
const commandLike = z.string();
const cssPath = z.string();
const shaderPath = z.string();

export const ghosttyConfigOptions = [
  { key: "language", schema: z.string() },

  { key: "font-family", schema: z.string() },
  { key: "font-family-bold", schema: z.string() },
  { key: "font-family-italic", schema: z.string() },
  { key: "font-family-bold-italic", schema: z.string() },

  { key: "font-style", schema: z.union([z.string(), z.literal(false)]) },
  { key: "font-style-bold", schema: z.union([z.string(), z.literal(false)]) },
  { key: "font-style-italic", schema: z.union([z.string(), z.literal(false)]) },
  { key: "font-style-bold-italic", schema: z.union([z.string(), z.literal(false)]) },

  {
    key: "font-synthetic-style",
    schema: z.union([
      z.boolean(),
      z.string().regex(
        /^(no-(bold|italic|bold-italic)|(bold|italic|bold-italic))(,(no-(bold|italic|bold-italic)|(bold|italic|bold-italic)))*$/
      ),
    ]),
  },
  { key: "font-feature", schema: featureSetting },
  { key: "font-size", schema: z.number() },

  { key: "font-variation", schema: fontVariation },
  { key: "font-variation-bold", schema: fontVariation },
  { key: "font-variation-italic", schema: fontVariation },
  { key: "font-variation-bold-italic", schema: fontVariation },

  { key: "font-codepoint-map", schema: fontCodepointMap },
  { key: "clipboard-codepoint-map", schema: clipboardCodepointMap },

  { key: "font-thicken", schema: z.boolean() },
  { key: "font-thicken-strength", schema: z.number().int().min(0).max(255) },

  {
    key: "font-shaping-break",
    schema: z.string().regex(/^(no-)?cursor(,(no-)?cursor)*$/),
  },

  {
    key: "alpha-blending",
    schema: z.enum(["native", "linear", "linear-corrected"]),
  },

  { key: "adjust-cell-width", schema: z.number() },
  { key: "adjust-cell-height", schema: z.number() },
  { key: "adjust-font-baseline", schema: z.number() },
  { key: "adjust-underline-position", schema: z.number() },
  { key: "adjust-underline-thickness", schema: z.number() },
  { key: "adjust-strikethrough-position", schema: z.number() },
  { key: "adjust-strikethrough-thickness", schema: z.number() },
  { key: "adjust-overline-position", schema: z.number() },
  { key: "adjust-overline-thickness", schema: z.number() },
  { key: "adjust-cursor-thickness", schema: z.number() },
  { key: "adjust-cursor-height", schema: z.number() },
  { key: "adjust-box-thickness", schema: z.number() },
  { key: "adjust-icon-height", schema: z.number() },

  { key: "grapheme-width-method", schema: z.string() },
  { key: "freetype-load-flags", schema: z.string() },

  { key: "theme", schema: z.string() },
  { key: "background", schema: hexOrNamedColor },
  { key: "foreground", schema: hexOrNamedColor },

  { key: "background-image", schema: pathLike },
  { key: "background-image-opacity", schema: opacity01 },
  { key: "background-image-position", schema: z.string() },
  { key: "background-image-fit", schema: z.string() },
  { key: "background-image-repeat", schema: z.boolean() },

  { key: "selection-foreground", schema: hexOrNamedColor },
  { key: "selection-background", schema: hexOrNamedColor },
  { key: "selection-clear-on-typing", schema: z.boolean() },
  { key: "selection-clear-on-copy", schema: z.boolean() },
  { key: "selection-word-chars", schema: z.string() },

  { key: "minimum-contrast", schema: z.number() },
  { key: "palette", schema: z.string() },
  { key: "palette-generate", schema: z.boolean() },
  { key: "palette-harmonious", schema: z.boolean() },

  { key: "cursor-color", schema: colorValue },
  { key: "cursor-opacity", schema: opacity01 },
  {
    key: "cursor-style",
    schema: z.enum(["block", "bar", "underline", "block_hollow"]),
  },
  { key: "cursor-style-blink", schema: z.boolean().nullable().optional() },
  { key: "cursor-text", schema: hexOrNamedColor },
  { key: "cursor-click-to-move", schema: z.boolean() },

  { key: "mouse-hide-while-typing", schema: z.boolean() },
  { key: "scroll-to-bottom", schema: z.boolean() },
  { key: "mouse-shift-capture", schema: z.boolean() },
  { key: "mouse-reporting", schema: z.boolean() },
  { key: "mouse-scroll-multiplier", schema: z.number() },

  { key: "background-opacity", schema: opacity01 },
  { key: "background-opacity-cells", schema: opacity01 },
  { key: "background-blur", schema: z.number() },
  { key: "unfocused-split-opacity", schema: opacity01 },
  { key: "unfocused-split-fill", schema: hexOrNamedColor },
  { key: "split-divider-color", schema: hexOrNamedColor },
  { key: "split-preserve-zoom", schema: z.boolean() },

  { key: "search-foreground", schema: hexOrNamedColor },
  { key: "search-background", schema: hexOrNamedColor },
  { key: "search-selected-foreground", schema: hexOrNamedColor },
  { key: "search-selected-background", schema: hexOrNamedColor },

  { key: "command", schema: commandLike },
  { key: "initial-command", schema: commandLike },
  { key: "notify-on-command-finish", schema: z.boolean() },
  { key: "notify-on-command-finish-action", schema: z.string() },
  { key: "notify-on-command-finish-after", schema: z.number() },

  { key: "env", schema: envAssignment },
  { key: "input", schema: pathLike },
  { key: "wait-after-command", schema: z.boolean() },
  { key: "abnormal-command-exit-runtime", schema: z.number().int().nonnegative() },
  { key: "scrollback-limit", schema: z.number().int().nonnegative() },

  {
    key: "scrollbar",
    schema: z.enum(["system", "always", "never"]),
  },

  { key: "link", schema: z.boolean() },
  { key: "link-url", schema: z.boolean() },
  { key: "link-previews", schema: z.boolean() },

  { key: "maximize", schema: z.boolean() },
  { key: "fullscreen", schema: z.boolean() },
  { key: "title", schema: z.string() },
  { key: "class", schema: z.string() },
  { key: "x11-instance-name", schema: z.string() },
  { key: "working-directory", schema: pathLike },

  { key: "keybind", schema: keybindLike },
  { key: "key-remap", schema: keyRemapLike },

  { key: "window-padding-x", schema: z.number() },
  { key: "window-padding-y", schema: z.number() },
  { key: "window-padding-balance", schema: z.boolean() },
  { key: "window-padding-color", schema: hexOrNamedColor },
  { key: "window-vsync", schema: z.boolean() },

  { key: "window-inherit-working-directory", schema: z.boolean() },
  { key: "tab-inherit-working-directory", schema: z.boolean() },
  { key: "split-inherit-working-directory", schema: z.boolean() },
  { key: "window-inherit-font-size", schema: z.boolean() },

  { key: "window-decoration", schema: z.boolean() },
  { key: "window-title-font-family", schema: z.string() },
  { key: "window-subtitle", schema: z.string() },
  { key: "window-theme", schema: z.string() },
  { key: "window-colorspace", schema: z.string() },
  { key: "window-height", schema: z.number().int() },
  { key: "window-width", schema: z.number().int() },
  { key: "window-position-x", schema: z.number().int() },
  { key: "window-position-y", schema: z.number().int() },
  { key: "window-save-state", schema: z.boolean() },
  { key: "window-step-resize", schema: z.boolean() },
  { key: "window-new-tab-position", schema: z.string() },
  { key: "window-show-tab-bar", schema: z.boolean() },
  { key: "window-titlebar-background", schema: hexOrNamedColor },
  { key: "window-titlebar-foreground", schema: hexOrNamedColor },

  { key: "resize-overlay", schema: z.boolean() },
  { key: "resize-overlay-position", schema: z.string() },
  { key: "resize-overlay-duration", schema: z.number().int().nonnegative() },

  { key: "focus-follows-mouse", schema: z.boolean() },

  { key: "clipboard-read", schema: z.boolean() },
  { key: "clipboard-write", schema: z.boolean() },
  { key: "clipboard-trim-trailing-spaces", schema: z.boolean() },
  { key: "clipboard-paste-protection", schema: z.boolean() },
  { key: "clipboard-paste-bracketed-safe", schema: z.boolean() },

  { key: "title-report", schema: z.boolean() },
  { key: "image-storage-limit", schema: z.number().int().nonnegative() },
  { key: "copy-on-select", schema: z.boolean() },
  { key: "right-click-action", schema: z.string() },
  { key: "click-repeat-interval", schema: z.number().int().nonnegative() },

  { key: "config-file", schema: pathLike },
  { key: "config-default-files", schema: z.boolean() },

  {
    key: "confirm-close-surface",
    schema: z.union([z.boolean(), z.literal("always")]),
  },

  { key: "quit-after-last-window-closed", schema: z.boolean() },
  { key: "quit-after-last-window-closed-delay", schema: z.number().int().nonnegative() },

  { key: "initial-window", schema: z.boolean() },
  { key: "undo-timeout", schema: z.number().int().nonnegative() },

  { key: "quick-terminal-position", schema: z.string() },
  { key: "quick-terminal-size", schema: z.number() },
  { key: "gtk-quick-terminal-layer", schema: z.string() },
  { key: "gtk-quick-terminal-namespace", schema: z.string() },
  { key: "quick-terminal-screen", schema: z.string() },
  { key: "quick-terminal-animation-duration", schema: z.number().int().nonnegative() },
  { key: "quick-terminal-autohide", schema: z.boolean() },
  { key: "quick-terminal-space-behavior", schema: z.string() },
  { key: "quick-terminal-keyboard-interactivity", schema: z.boolean() },

  { key: "shell-integration", schema: z.boolean() },
  { key: "shell-integration-features", schema: z.string() },
  { key: "command-palette-entry", schema: z.string() },
  { key: "osc-color-report-format", schema: z.string() },
  { key: "vt-kam-allowed", schema: z.boolean() },

  { key: "custom-shader", schema: shaderPath },
  { key: "custom-shader-animation", schema: z.boolean() },

  { key: "bell-features", schema: z.string() },
  { key: "bell-audio-path", schema: pathLike },
  { key: "bell-audio-volume", schema: z.number() },

  { key: "app-notifications", schema: z.boolean() },

  { key: "macos-non-native-fullscreen", schema: z.boolean() },
  { key: "macos-window-buttons", schema: z.string() },
  { key: "macos-titlebar-style", schema: z.string() },
  { key: "macos-titlebar-proxy-icon", schema: z.boolean() },
  { key: "macos-dock-drop-behavior", schema: z.string() },
  { key: "macos-option-as-alt", schema: z.string() },
  { key: "macos-window-shadow", schema: z.boolean() },
  { key: "macos-hidden", schema: z.boolean() },
  { key: "macos-auto-secure-input", schema: z.boolean() },
  { key: "macos-secure-input-indication", schema: z.boolean() },
  { key: "macos-applescript", schema: z.boolean() },
  { key: "macos-icon", schema: z.string() },
  { key: "macos-custom-icon", schema: pathLike },
  { key: "macos-icon-frame", schema: hexOrNamedColor },
  { key: "macos-icon-ghost-color", schema: hexOrNamedColor },
  {
    key: "macos-icon-screen-color",
    schema: z.string().regex(
      /^([^,]+)(,[^,]+){0,63}$/
    ), // up to 64 comma-separated colors
  },
  {
    key: "macos-shortcuts",
    schema: z.enum(["ask", "allow", "deny"]),
  },

  { key: "linux-cgroup", schema: z.boolean() },
  { key: "linux-cgroup-memory-limit", schema: z.number().int().nonnegative() },
  { key: "linux-cgroup-processes-limit", schema: z.number().int().nonnegative() },
  { key: "linux-cgroup-hard-fail", schema: z.boolean() },

  { key: "gtk-opengl-debug", schema: z.boolean() },
  { key: "gtk-single-instance", schema: z.boolean() },
  { key: "gtk-titlebar", schema: z.boolean() },
  { key: "gtk-tabs-location", schema: z.string() },
  { key: "gtk-titlebar-hide-when-maximized", schema: z.boolean() },
  { key: "gtk-toolbar-style", schema: z.string() },
  { key: "gtk-titlebar-style", schema: z.string() },
  { key: "gtk-wide-tabs", schema: z.boolean() },
  { key: "gtk-custom-css", schema: cssPath },

  { key: "desktop-notifications", schema: z.boolean() },
  { key: "progress-style", schema: z.boolean() },

  {
    key: "bold-color",
    schema: z.union([hexOrNamedColor, z.literal("bright")]),
  },

  { key: "faint-opacity", schema: opacity01 },
  { key: "term", schema: z.string() },
  { key: "enquiry-response", schema: z.string() },

  {
    key: "async-backend",
    schema: z.enum(["auto", "epoll", "io_uring"]),
  },

  {
    key: "auto-update",
    schema: z.enum(["off", "check", "download"]),
  },

  {
    key: "auto-update-channel",
    schema: z.enum(["stable", "tip"]),
  },
] as const;
