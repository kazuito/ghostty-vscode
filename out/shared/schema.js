"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigKeysByPlatform = exports.getConfigKeysByType = exports.getAllConfigKeys = exports.getConfigKeyInfo = exports.GHOSTTY_CONFIG_MAP = exports.GHOSTTY_CONFIG_SCHEMA = void 0;
exports.GHOSTTY_CONFIG_SCHEMA = [
    // Alpha Blending
    {
        key: 'alpha-blending',
        description: 'Configuration for alpha blending in different color spaces. Affects text and image transparency rendering.',
        valueType: 'enum',
        enumValues: ['native', 'linear', 'linear-corrected'],
        examples: ['native', 'linear']
    },
    // Color Configuration
    {
        key: 'background',
        description: 'Background color of the terminal window. Can be hex color or named color.',
        valueType: 'color',
        examples: ['#282c34', '#000000', 'black']
    },
    {
        key: 'foreground',
        description: 'Foreground (text) color of the terminal window. Can be hex color or named color.',
        valueType: 'color',
        examples: ['#ffffff', '#c6d0f5', 'white']
    },
    {
        key: 'selection-foreground',
        description: 'Text color for selected text. Can be hex color or named color.',
        valueType: 'color',
        examples: ['#ffffff', 'white']
    },
    {
        key: 'selection-background',
        description: 'Background color for selected text. Can be hex color or named color.',
        valueType: 'color',
        examples: ['#626880', '#444444']
    },
    {
        key: 'selection-invert-fg-bg',
        description: 'Whether to invert foreground and background colors for selection.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'minimum-contrast',
        description: 'Minimum contrast ratio for text readability.',
        valueType: 'number',
        examples: ['1.0', '1.5']
    },
    {
        key: 'palette',
        description: 'Set colors in the 16-color palette. Format: palette = N=#color where N is 0-15.',
        valueType: 'string',
        pattern: '^(0|1[0-5]|[1-9])=#?[0-9a-fA-F]{3,8}$',
        examples: ['0=#1d2021', '1=#cc241d', '15=#fbf1c7']
    },
    // Cursor Configuration
    {
        key: 'cursor-color',
        description: 'Color of the cursor. Can be hex color or named color.',
        valueType: 'color',
        examples: ['#f2d5cf', '#ffffff']
    },
    {
        key: 'cursor-invert-fg-bg',
        description: 'Whether to invert foreground and background colors for cursor.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'cursor-opacity',
        description: 'Opacity of the cursor (0.0 to 1.0).',
        valueType: 'number',
        examples: ['1.0', '0.8']
    },
    {
        key: 'cursor-text',
        description: 'Text color under the cursor. Can be hex color or named color.',
        valueType: 'color',
        examples: ['#c6d0f5', '#000000']
    },
    {
        key: 'cursor-style',
        description: 'Style of the cursor.',
        valueType: 'enum',
        enumValues: ['block', 'bar', 'underline', 'block_hollow'],
        examples: ['block', 'bar']
    },
    {
        key: 'cursor-style-blink',
        description: 'Whether the cursor should blink.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'cursor-click-to-move',
        description: 'Whether clicking moves the cursor.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    // Font Configuration
    {
        key: 'font-family',
        description: 'Font family for regular text.',
        valueType: 'string',
        examples: ['JetBrains Mono', 'Fira Code', 'Menlo']
    },
    {
        key: 'font-family-bold',
        description: 'Font family for bold text.',
        valueType: 'string',
        examples: ['JetBrains Mono Bold', 'Fira Code Bold']
    },
    {
        key: 'font-family-italic',
        description: 'Font family for italic text.',
        valueType: 'string',
        examples: ['JetBrains Mono Italic', 'Fira Code Italic']
    },
    {
        key: 'font-family-bold-italic',
        description: 'Font family for bold italic text.',
        valueType: 'string',
        examples: ['JetBrains Mono Bold Italic']
    },
    {
        key: 'font-size',
        description: 'Font size in points.',
        valueType: 'number',
        examples: ['12', '14', '16']
    },
    {
        key: 'font-style',
        description: 'Font style for regular text.',
        valueType: 'string',
        examples: ['normal', 'italic']
    },
    {
        key: 'font-style-bold',
        description: 'Font style for bold text.',
        valueType: 'string',
        examples: ['normal', 'italic']
    },
    {
        key: 'font-style-italic',
        description: 'Font style for italic text.',
        valueType: 'string',
        examples: ['normal', 'italic']
    },
    {
        key: 'font-style-bold-italic',
        description: 'Font style for bold italic text.',
        valueType: 'string',
        examples: ['normal', 'italic']
    },
    {
        key: 'font-synthetic-style',
        description: 'Whether to use synthetic font styles.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'font-feature',
        description: 'Font feature settings.',
        valueType: 'string',
        examples: ['liga', 'calt']
    },
    {
        key: 'font-variation',
        description: 'Font variation settings for regular text.',
        valueType: 'string',
        examples: ['wght=400']
    },
    {
        key: 'font-variation-bold',
        description: 'Font variation settings for bold text.',
        valueType: 'string',
        examples: ['wght=700']
    },
    {
        key: 'font-variation-italic',
        description: 'Font variation settings for italic text.',
        valueType: 'string',
        examples: ['slnt=-15']
    },
    {
        key: 'font-variation-bold-italic',
        description: 'Font variation settings for bold italic text.',
        valueType: 'string',
        examples: ['wght=700,slnt=-15']
    },
    {
        key: 'font-codepoint-map',
        description: 'Custom codepoint mappings for fonts.',
        valueType: 'string',
        examples: ['U+E0A0=FontAwesome']
    },
    {
        key: 'font-thicken',
        description: 'Whether to thicken fonts.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'font-thicken-strength',
        description: 'Strength of font thickening.',
        valueType: 'number',
        examples: ['0.1', '0.2']
    },
    // Window Configuration
    {
        key: 'window-padding-x',
        description: 'Horizontal padding around the terminal content.',
        valueType: 'number',
        examples: ['10', '20']
    },
    {
        key: 'window-padding-y',
        description: 'Vertical padding around the terminal content.',
        valueType: 'number',
        examples: ['10', '20']
    },
    {
        key: 'window-padding-balance',
        description: 'Whether to balance padding when window is resized.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'window-padding-color',
        description: 'Color of the window padding area.',
        valueType: 'color',
        examples: ['#282c34', 'background']
    },
    {
        key: 'window-vsync',
        description: 'Whether to enable vertical synchronization.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'window-inherit-working-directory',
        description: 'Whether new windows inherit the working directory.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'window-inherit-font-size',
        description: 'Whether new windows inherit the font size.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'window-decoration',
        description: 'Type of window decorations.',
        valueType: 'enum',
        enumValues: ['none', 'client', 'server', 'native'],
        examples: ['native', 'client']
    },
    {
        key: 'window-title-font-family',
        description: 'Font family for window title.',
        valueType: 'string',
        examples: ['System Font', 'San Francisco']
    },
    {
        key: 'window-subtitle',
        description: 'Subtitle format for the window.',
        valueType: 'string',
        examples: ['%{cwd}', '%{command}']
    },
    {
        key: 'window-theme',
        description: 'Theme for window decorations.',
        valueType: 'enum',
        enumValues: ['auto', 'system', 'light', 'dark', 'ghostty'],
        examples: ['auto', 'dark']
    },
    {
        key: 'window-colorspace',
        description: 'Color space for the window.',
        valueType: 'enum',
        enumValues: ['srgb', 'display-p3'],
        examples: ['srgb', 'display-p3']
    },
    {
        key: 'window-height',
        description: 'Initial window height in rows.',
        valueType: 'number',
        examples: ['24', '30']
    },
    {
        key: 'window-width',
        description: 'Initial window width in columns.',
        valueType: 'number',
        examples: ['80', '120']
    },
    {
        key: 'window-position-x',
        description: 'Initial window X position.',
        valueType: 'number',
        examples: ['100', '200']
    },
    {
        key: 'window-position-y',
        description: 'Initial window Y position.',
        valueType: 'number',
        examples: ['100', '200']
    },
    {
        key: 'window-save-state',
        description: 'Whether to save window state between sessions.',
        valueType: 'enum',
        enumValues: ['never', 'always', 'after-first'],
        examples: ['never', 'always']
    },
    {
        key: 'window-step-resize',
        description: 'Whether to resize in character steps.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'window-new-tab-position',
        description: 'Position for new tabs.',
        valueType: 'enum',
        enumValues: ['current', 'end'],
        examples: ['current', 'end']
    },
    {
        key: 'maximize',
        description: 'Whether to maximize the window on startup.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'fullscreen',
        description: 'Whether to start in fullscreen mode.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'title',
        description: 'Window title format.',
        valueType: 'string',
        examples: ['Ghostty', '%{cwd}']
    },
    {
        key: 'class',
        description: 'Window class name (Linux/X11).',
        valueType: 'string',
        examples: ['Ghostty', 'Terminal']
    },
    {
        key: 'x11-instance-name',
        description: 'X11 instance name.',
        valueType: 'string',
        examples: ['ghostty']
    },
    // Theme Configuration
    {
        key: 'theme',
        description: 'Built-in theme name, file path, or light/dark theme combination.',
        valueType: 'theme',
        examples: ['catppuccin-frappe', 'dark:catppuccin-frappe,light:catppuccin-latte', '/path/to/theme.conf']
    },
    // Keybind Configuration
    {
        key: 'keybind',
        description: 'Keyboard binding configuration. Format: [prefix:]trigger=action[:parameter]',
        valueType: 'keybind',
        examples: ['ctrl+c=copy_to_clipboard', 'performable:ctrl+c=copy_to_clipboard', 'ctrl+a>n=new_window']
    },
    // Mouse Configuration
    {
        key: 'mouse-hide-while-typing',
        description: 'Whether to hide mouse cursor while typing.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'mouse-shift-capture',
        description: 'Whether shift+click captures mouse.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'mouse-scroll-multiplier',
        description: 'Scroll speed multiplier for mouse wheel.',
        valueType: 'number',
        examples: ['1.0', '2.0']
    },
    {
        key: 'focus-follows-mouse',
        description: 'Whether focus follows mouse pointer.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    // Terminal Configuration
    {
        key: 'command',
        description: 'Command to run in the terminal.',
        valueType: 'string',
        examples: ['bash', 'zsh', '/bin/sh']
    },
    {
        key: 'initial-command',
        description: 'Initial command to run when terminal starts.',
        valueType: 'string',
        examples: ['ls', 'cd ~']
    },
    {
        key: 'wait-after-command',
        description: 'Whether to wait after command execution.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'abnormal-command-exit-runtime',
        description: 'How long to keep terminal open after abnormal command exit.',
        valueType: 'number',
        examples: ['2000', '5000']
    },
    {
        key: 'scrollback-limit',
        description: 'Number of lines to keep in scrollback buffer.',
        valueType: 'number',
        examples: ['10000', '50000']
    },
    {
        key: 'working-directory',
        description: 'Initial working directory.',
        valueType: 'path',
        examples: ['~', '/home/user', 'inherit']
    },
    {
        key: 'term',
        description: 'TERM environment variable value.',
        valueType: 'string',
        examples: ['xterm-256color', 'xterm-ghostty']
    },
    {
        key: 'enquiry-response',
        description: 'Response to ENQ character.',
        valueType: 'string',
        examples: ['Ghostty']
    },
    {
        key: 'bold-is-bright',
        description: 'Whether bold text uses bright colors.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'grapheme-width-method',
        description: 'Method for calculating grapheme width.',
        valueType: 'enum',
        enumValues: ['unicode', 'legacy'],
        examples: ['unicode', 'legacy']
    },
    {
        key: 'freetype-load-flags',
        description: 'FreeType loading flags.',
        valueType: 'string',
        examples: ['default']
    },
    // Adjustment Configuration
    {
        key: 'adjust-cell-width',
        description: 'Adjustment to cell width in pixels or percentage.',
        valueType: 'string',
        pattern: '^-?\\d+(\\.\\d+)?%?$',
        examples: ['0', '1', '5%']
    },
    {
        key: 'adjust-cell-height',
        description: 'Adjustment to cell height in pixels or percentage.',
        valueType: 'string',
        pattern: '^-?\\d+(\\.\\d+)?%?$',
        examples: ['0', '1', '5%']
    },
    {
        key: 'adjust-font-baseline',
        description: 'Adjustment to font baseline in pixels or percentage.',
        valueType: 'string',
        pattern: '^-?\\d+(\\.\\d+)?%?$',
        examples: ['0', '1', '5%']
    },
    {
        key: 'adjust-underline-position',
        description: 'Adjustment to underline position in pixels or percentage.',
        valueType: 'string',
        pattern: '^-?\\d+(\\.\\d+)?%?$',
        examples: ['0', '1', '5%']
    },
    {
        key: 'adjust-underline-thickness',
        description: 'Adjustment to underline thickness in pixels or percentage.',
        valueType: 'string',
        pattern: '^-?\\d+(\\.\\d+)?%?$',
        examples: ['0', '1', '5%']
    },
    {
        key: 'adjust-strikethrough-position',
        description: 'Adjustment to strikethrough position in pixels or percentage.',
        valueType: 'string',
        pattern: '^-?\\d+(\\.\\d+)?%?$',
        examples: ['0', '1', '5%']
    },
    {
        key: 'adjust-strikethrough-thickness',
        description: 'Adjustment to strikethrough thickness in pixels or percentage.',
        valueType: 'string',
        pattern: '^-?\\d+(\\.\\d+)?%?$',
        examples: ['0', '1', '5%']
    },
    {
        key: 'adjust-overline-position',
        description: 'Adjustment to overline position in pixels or percentage.',
        valueType: 'string',
        pattern: '^-?\\d+(\\.\\d+)?%?$',
        examples: ['0', '1', '5%']
    },
    {
        key: 'adjust-overline-thickness',
        description: 'Adjustment to overline thickness in pixels or percentage.',
        valueType: 'string',
        pattern: '^-?\\d+(\\.\\d+)?%?$',
        examples: ['0', '1', '5%']
    },
    {
        key: 'adjust-cursor-thickness',
        description: 'Adjustment to cursor thickness in pixels or percentage.',
        valueType: 'string',
        pattern: '^-?\\d+(\\.\\d+)?%?$',
        examples: ['0', '1', '5%']
    },
    {
        key: 'adjust-cursor-height',
        description: 'Adjustment to cursor height in pixels or percentage.',
        valueType: 'string',
        pattern: '^-?\\d+(\\.\\d+)?%?$',
        examples: ['0', '1', '5%']
    },
    {
        key: 'adjust-box-thickness',
        description: 'Adjustment to box drawing thickness in pixels or percentage.',
        valueType: 'string',
        pattern: '^-?\\d+(\\.\\d+)?%?$',
        examples: ['0', '1', '5%']
    },
    // Background Configuration
    {
        key: 'background-opacity',
        description: 'Background opacity (0.0 to 1.0).',
        valueType: 'number',
        examples: ['1.0', '0.9']
    },
    {
        key: 'background-blur',
        description: 'Background blur radius.',
        valueType: 'number',
        examples: ['0', '20']
    },
    // Clipboard Configuration
    {
        key: 'clipboard-read',
        description: 'Whether to allow reading from clipboard.',
        valueType: 'enum',
        enumValues: ['allow', 'deny', 'ask'],
        examples: ['allow', 'ask']
    },
    {
        key: 'clipboard-write',
        description: 'Whether to allow writing to clipboard.',
        valueType: 'enum',
        enumValues: ['allow', 'deny', 'ask'],
        examples: ['allow', 'ask']
    },
    {
        key: 'clipboard-trim-trailing-spaces',
        description: 'Whether to trim trailing spaces when copying.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'clipboard-paste-protection',
        description: 'Whether to enable paste protection.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'clipboard-paste-bracketed-safe',
        description: 'Whether to use safe bracketed paste mode.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'copy-on-select',
        description: 'Whether to copy text on selection.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'click-repeat-interval',
        description: 'Interval for click repeat detection in milliseconds.',
        valueType: 'number',
        examples: ['300', '500']
    },
    // Link Configuration
    {
        key: 'link',
        description: 'Whether to enable link detection.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'link-url',
        description: 'Whether to enable URL link detection.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    // Config File Configuration
    {
        key: 'config-file',
        description: 'Path to additional configuration file.',
        valueType: 'path',
        examples: ['~/.config/ghostty/config', './local-config']
    },
    {
        key: 'config-default-files',
        description: 'Whether to load default configuration files.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'confirm-close-surface',
        description: 'Whether to confirm before closing surfaces.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'quit-after-last-window-closed',
        description: 'Whether to quit after last window is closed.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'quit-after-last-window-closed-delay',
        description: 'Delay before quitting after last window closed (milliseconds).',
        valueType: 'number',
        examples: ['0', '1000']
    },
    {
        key: 'initial-window',
        description: 'Whether to show initial window.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    // Resize Configuration
    {
        key: 'resize-overlay',
        description: 'Whether to show resize overlay.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'resize-overlay-position',
        description: 'Position of resize overlay.',
        valueType: 'enum',
        enumValues: ['center', 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'],
        examples: ['center', 'top-right']
    },
    {
        key: 'resize-overlay-duration',
        description: 'Duration to show resize overlay (milliseconds).',
        valueType: 'number',
        examples: ['1000', '2000']
    },
    // Quick Terminal Configuration
    {
        key: 'quick-terminal-position',
        description: 'Position of quick terminal.',
        valueType: 'enum',
        enumValues: ['top', 'bottom', 'left', 'right'],
        examples: ['top', 'bottom']
    },
    {
        key: 'quick-terminal-screen',
        description: 'Screen to show quick terminal on.',
        valueType: 'enum',
        enumValues: ['main', 'mouse'],
        examples: ['main', 'mouse']
    },
    {
        key: 'quick-terminal-animation-duration',
        description: 'Duration of quick terminal animation (milliseconds).',
        valueType: 'number',
        examples: ['200', '300']
    },
    {
        key: 'quick-terminal-autohide',
        description: 'Whether to auto-hide quick terminal.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    {
        key: 'quick-terminal-space-behavior',
        description: 'Behavior of quick terminal in spaces.',
        valueType: 'enum',
        enumValues: ['move', 'remain'],
        examples: ['move', 'remain']
    },
    // Shell Integration
    {
        key: 'shell-integration',
        description: 'Shell integration mode.',
        valueType: 'enum',
        enumValues: ['detect', 'bash', 'elvish', 'fish', 'zsh', 'none'],
        examples: ['detect', 'fish']
    },
    {
        key: 'shell-integration-features',
        description: 'Shell integration features to enable.',
        valueType: 'string',
        examples: ['cursor,sudo,title', 'no-cursor,no-sudo,no-title']
    },
    // Security Configuration
    {
        key: 'title-report',
        description: 'Whether to allow title reporting.',
        valueType: 'enum',
        enumValues: ['allow', 'deny', 'ask'],
        examples: ['allow', 'ask']
    },
    {
        key: 'image-storage-limit',
        description: 'Limit for image storage in bytes.',
        valueType: 'number',
        examples: ['100000000', '50000000']
    },
    {
        key: 'osc-color-report-format',
        description: 'Format for OSC color reports.',
        valueType: 'enum',
        enumValues: ['8-bit', '16-bit'],
        examples: ['8-bit', '16-bit']
    },
    {
        key: 'vt-kam-allowed',
        description: 'Whether VT KAM sequence is allowed.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    // Shader Configuration
    {
        key: 'custom-shader',
        description: 'Path to custom GLSL shader file.',
        valueType: 'path',
        examples: ['~/.config/ghostty/shader.glsl']
    },
    {
        key: 'custom-shader-animation',
        description: 'Whether to enable shader animation.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    // Notification Configuration
    {
        key: 'app-notifications',
        description: 'Application notifications to enable.',
        valueType: 'string',
        examples: ['clipboard-copy', 'no-clipboard-copy']
    },
    {
        key: 'desktop-notifications',
        description: 'Whether to enable desktop notifications.',
        valueType: 'boolean',
        examples: ['true', 'false']
    },
    // Split Configuration
    {
        key: 'split-divider-color',
        description: 'Color of split dividers.',
        valueType: 'color',
        examples: ['#444444', '#626880']
    },
    {
        key: 'unfocused-split-opacity',
        description: 'Opacity of unfocused splits.',
        valueType: 'number',
        examples: ['1.0', '0.8']
    },
    {
        key: 'unfocused-split-fill',
        description: 'Fill color for unfocused splits.',
        valueType: 'color',
        examples: ['#000000', 'background']
    },
    // Titlebar Configuration
    {
        key: 'window-titlebar-background',
        description: 'Background color of window titlebar.',
        valueType: 'color',
        examples: ['#282c34', 'background']
    },
    {
        key: 'window-titlebar-foreground',
        description: 'Foreground color of window titlebar.',
        valueType: 'color',
        examples: ['#ffffff', 'foreground']
    },
    // macOS-specific Configuration
    {
        key: 'macos-non-native-fullscreen',
        description: 'Whether to use non-native fullscreen on macOS.',
        valueType: 'boolean',
        examples: ['true', 'false'],
        platforms: ['macos']
    },
    {
        key: 'macos-titlebar-style',
        description: 'Style of titlebar on macOS.',
        valueType: 'enum',
        enumValues: ['native', 'transparent', 'tabs', 'hidden'],
        examples: ['native', 'transparent'],
        platforms: ['macos']
    },
    {
        key: 'macos-titlebar-proxy-icon',
        description: 'Whether to show proxy icon in titlebar on macOS.',
        valueType: 'boolean',
        examples: ['true', 'false'],
        platforms: ['macos']
    },
    {
        key: 'macos-option-as-alt',
        description: 'Whether to treat option key as alt on macOS.',
        valueType: 'boolean',
        examples: ['true', 'false'],
        platforms: ['macos']
    },
    {
        key: 'macos-window-shadow',
        description: 'Whether to show window shadow on macOS.',
        valueType: 'boolean',
        examples: ['true', 'false'],
        platforms: ['macos']
    },
    {
        key: 'macos-auto-secure-input',
        description: 'Whether to auto-enable secure input on macOS.',
        valueType: 'boolean',
        examples: ['true', 'false'],
        platforms: ['macos']
    },
    {
        key: 'macos-secure-input-indication',
        description: 'Whether to show secure input indication on macOS.',
        valueType: 'boolean',
        examples: ['true', 'false'],
        platforms: ['macos']
    },
    {
        key: 'macos-icon',
        description: 'Icon style for macOS app.',
        valueType: 'enum',
        enumValues: ['official', 'blueprint', 'chalkboard', 'microchip', 'glass', 'holographic', 'paper', 'retro', 'xray', 'custom-style'],
        examples: ['official', 'blueprint'],
        platforms: ['macos']
    },
    {
        key: 'macos-icon-frame',
        description: 'Frame material for custom macOS icon.',
        valueType: 'enum',
        enumValues: ['aluminum', 'beige', 'plastic', 'chrome'],
        examples: ['aluminum', 'beige'],
        platforms: ['macos']
    },
    {
        key: 'macos-icon-ghost-color',
        description: 'Ghost color for custom macOS icon.',
        valueType: 'color',
        examples: ['#ffffff', '#000000'],
        platforms: ['macos']
    },
    {
        key: 'macos-icon-screen-color',
        description: 'Screen color for custom macOS icon.',
        valueType: 'color',
        examples: ['#00ff00', '#ffffff'],
        platforms: ['macos']
    },
    // Linux-specific Configuration
    {
        key: 'linux-cgroup',
        description: 'Linux cgroup configuration.',
        valueType: 'string',
        examples: ['v2', 'v1'],
        platforms: ['linux']
    },
    {
        key: 'linux-cgroup-memory-limit',
        description: 'Memory limit for Linux cgroup.',
        valueType: 'number',
        examples: ['100000000', '50000000'],
        platforms: ['linux']
    },
    {
        key: 'linux-cgroup-processes-limit',
        description: 'Process limit for Linux cgroup.',
        valueType: 'number',
        examples: ['100', '50'],
        platforms: ['linux']
    },
    {
        key: 'linux-cgroup-hard-fail',
        description: 'Whether to hard fail on Linux cgroup errors.',
        valueType: 'boolean',
        examples: ['true', 'false'],
        platforms: ['linux']
    },
    // GTK-specific Configuration
    {
        key: 'gtk-opengl-debug',
        description: 'Whether to enable OpenGL debugging in GTK.',
        valueType: 'boolean',
        examples: ['true', 'false'],
        platforms: ['linux']
    },
    {
        key: 'gtk-gsk-renderer',
        description: 'GSK renderer to use in GTK.',
        valueType: 'string',
        examples: ['gl', 'cairo'],
        platforms: ['linux']
    },
    {
        key: 'gtk-single-instance',
        description: 'Whether to use single instance mode in GTK.',
        valueType: 'boolean',
        examples: ['true', 'false'],
        platforms: ['linux']
    },
    {
        key: 'gtk-titlebar',
        description: 'Whether to show titlebar in GTK.',
        valueType: 'boolean',
        examples: ['true', 'false'],
        platforms: ['linux']
    },
    {
        key: 'gtk-tabs-location',
        description: 'Location of tabs in GTK.',
        valueType: 'enum',
        enumValues: ['top', 'bottom', 'left', 'right'],
        examples: ['top', 'bottom'],
        platforms: ['linux']
    },
    {
        key: 'gtk-titlebar-hide-when-maximized',
        description: 'Whether to hide titlebar when maximized in GTK.',
        valueType: 'boolean',
        examples: ['true', 'false'],
        platforms: ['linux']
    },
    {
        key: 'adw-toolbar-style',
        description: 'Adwaita toolbar style.',
        valueType: 'enum',
        enumValues: ['flat', 'raised', 'raised-border'],
        examples: ['flat', 'raised'],
        platforms: ['linux']
    },
    {
        key: 'gtk-wide-tabs',
        description: 'Whether to use wide tabs in GTK.',
        valueType: 'boolean',
        examples: ['true', 'false'],
        platforms: ['linux']
    },
    {
        key: 'gtk-adwaita',
        description: 'Whether to use Adwaita theme in GTK.',
        valueType: 'boolean',
        examples: ['true', 'false'],
        platforms: ['linux']
    },
    {
        key: 'gtk-custom-css',
        description: 'Path to custom CSS file for GTK.',
        valueType: 'path',
        examples: ['~/.config/ghostty/custom.css'],
        platforms: ['linux']
    },
    // Update Configuration
    {
        key: 'auto-update',
        description: 'Whether to enable automatic updates.',
        valueType: 'enum',
        enumValues: ['off', 'check', 'download'],
        examples: ['off', 'check']
    },
    {
        key: 'auto-update-channel',
        description: 'Update channel to use.',
        valueType: 'enum',
        enumValues: ['stable', 'tip'],
        examples: ['stable', 'tip']
    }
];
// Create a map for quick lookup
exports.GHOSTTY_CONFIG_MAP = new Map();
exports.GHOSTTY_CONFIG_SCHEMA.forEach(key => {
    exports.GHOSTTY_CONFIG_MAP.set(key.key, key);
});
function getConfigKeyInfo(key) {
    return exports.GHOSTTY_CONFIG_MAP.get(key);
}
exports.getConfigKeyInfo = getConfigKeyInfo;
function getAllConfigKeys() {
    return exports.GHOSTTY_CONFIG_SCHEMA.map(key => key.key);
}
exports.getAllConfigKeys = getAllConfigKeys;
function getConfigKeysByType(type) {
    return exports.GHOSTTY_CONFIG_SCHEMA.filter(key => key.valueType === type);
}
exports.getConfigKeysByType = getConfigKeysByType;
function getConfigKeysByPlatform(platform) {
    return exports.GHOSTTY_CONFIG_SCHEMA.filter(key => !key.platforms || key.platforms.includes(platform));
}
exports.getConfigKeysByPlatform = getConfigKeysByPlatform;
//# sourceMappingURL=schema.js.map