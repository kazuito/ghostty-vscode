export interface GhosttyConfigKey {
    key: string;
    description: string;
    valueType: 'color' | 'boolean' | 'number' | 'string' | 'enum' | 'keybind' | 'theme' | 'path' | 'percentage';
    enumValues?: string[];
    examples?: string[];
    platforms?: ('macos' | 'linux' | 'windows')[];
    deprecated?: boolean;
    pattern?: string;
}
export interface ConfigValue {
    type: 'color' | 'boolean' | 'number' | 'string' | 'enum' | 'keybind' | 'theme' | 'path' | 'percentage';
    value: string;
    raw: string;
}
export interface ConfigEntry {
    key: string;
    value: ConfigValue;
    line: number;
    keyRange: {
        start: number;
        end: number;
    };
    valueRange: {
        start: number;
        end: number;
    };
}
export interface ParsedConfig {
    entries: ConfigEntry[];
    comments: Array<{
        line: number;
        text: string;
        range: {
            start: number;
            end: number;
        };
    }>;
    errors: Array<{
        line: number;
        message: string;
        range: {
            start: number;
            end: number;
        };
    }>;
}
export interface KeybindTrigger {
    modifiers: string[];
    key: string;
    prefix?: 'global' | 'performable' | 'unconsumed' | 'all';
    physical?: boolean;
}
export interface KeybindAction {
    action: string;
    parameter?: string;
}
export interface ParsedKeybind {
    trigger: KeybindTrigger;
    action: KeybindAction;
    sequence?: KeybindTrigger[];
}
export declare const GHOSTTY_BUILT_IN_THEMES: readonly ["catppuccin-frappe", "catppuccin-latte", "catppuccin-macchiato", "catppuccin-mocha", "gruvbox", "gruvbox-light", "solarized-dark", "solarized-light", "tokyo-night", "tokyo-night-storm", "tomorrow-night"];
export type GhosttyTheme = typeof GHOSTTY_BUILT_IN_THEMES[number];
export declare const GHOSTTY_MODIFIERS: readonly ["shift", "ctrl", "control", "alt", "opt", "option", "super", "cmd", "command"];
export declare const GHOSTTY_KEYBIND_ACTIONS: readonly ["ignore", "unbind", "new_window", "new_tab", "close_window", "close_tab", "reload_config", "quit", "copy_to_clipboard", "paste_from_clipboard", "scroll_page_up", "scroll_page_down", "scroll_to_top", "scroll_to_bottom", "jump_to_prompt", "toggle_fullscreen", "toggle_quick_terminal", "toggle_window_decorations", "toggle_tab_overview", "increase_font_size", "decrease_font_size", "reset_font_size", "close_surface", "new_split", "split_vertical", "split_horizontal", "goto_split", "resize_split", "equalize_splits", "move_tab", "move_tab_to_new_window", "next_tab", "previous_tab", "goto_tab", "write_scrollback_file", "inspector", "text", "csi", "esc"];
export declare const GHOSTTY_NAMED_COLORS: readonly ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white", "gray", "grey", "darkred", "darkgreen", "darkyellow", "darkblue", "darkmagenta", "darkcyan", "lightgray", "lightgrey", "lightred", "lightgreen", "lightyellow", "lightblue", "lightmagenta", "lightcyan", "orange", "pink", "purple", "brown", "gold", "silver", "navy", "maroon", "olive", "lime", "aqua", "teal", "fuchsia", "transparent", "background", "extend", "extend-always"];
//# sourceMappingURL=types.d.ts.map