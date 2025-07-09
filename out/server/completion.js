"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompletionItems = void 0;
const node_1 = require("vscode-languageserver/node");
const schema_1 = require("../shared/schema");
const types_1 = require("../shared/types");
function getCompletionItems(text, offset, position) {
    const lines = text.split(/\r?\n/);
    const currentLine = lines[position.line];
    const beforeCursor = currentLine.substring(0, position.character);
    const afterCursor = currentLine.substring(position.character);
    // Check if we're in a comment
    if (beforeCursor.trim().startsWith('#')) {
        return [];
    }
    // Check if we're completing a key (before =)
    if (!beforeCursor.includes('=')) {
        return getKeyCompletions(beforeCursor);
    }
    // Check if we're completing a value (after =)
    const keyMatch = beforeCursor.match(/^(\s*)([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*(.*)$/);
    if (keyMatch) {
        const [, , key, partialValue] = keyMatch;
        return getValueCompletions(key, partialValue);
    }
    return [];
}
exports.getCompletionItems = getCompletionItems;
function getKeyCompletions(beforeCursor) {
    const trimmed = beforeCursor.trim();
    const items = [];
    // Filter keys that start with the current input
    const matchingKeys = (0, schema_1.getAllConfigKeys)().filter(key => key.startsWith(trimmed) || trimmed === '');
    for (const key of matchingKeys) {
        const keyInfo = (0, schema_1.getConfigKeyInfo)(key);
        if (!keyInfo)
            continue;
        let insertText = key;
        let detail = keyInfo.description;
        // Add example value in snippet
        if (keyInfo.examples && keyInfo.examples.length > 0) {
            insertText = `${key} = ${keyInfo.examples[0]}`;
            detail += `\n\nExample: ${keyInfo.examples[0]}`;
        }
        else {
            insertText = `${key} = `;
        }
        items.push({
            label: key,
            kind: node_1.CompletionItemKind.Property,
            detail: detail,
            documentation: {
                kind: node_1.MarkupKind.Markdown,
                value: formatKeyDocumentation(keyInfo)
            },
            insertText: insertText,
            insertTextFormat: node_1.InsertTextFormat.PlainText
        });
    }
    return items;
}
function getValueCompletions(key, partialValue) {
    const keyInfo = (0, schema_1.getConfigKeyInfo)(key);
    if (!keyInfo) {
        return [];
    }
    const items = [];
    switch (keyInfo.valueType) {
        case 'boolean':
            items.push(...getBooleanCompletions(partialValue));
            break;
        case 'color':
            items.push(...getColorCompletions(partialValue));
            break;
        case 'enum':
            items.push(...getEnumCompletions(partialValue, keyInfo.enumValues || []));
            break;
        case 'theme':
            items.push(...getThemeCompletions(partialValue));
            break;
        case 'keybind':
            items.push(...getKeybindCompletions(partialValue));
            break;
        case 'number':
            items.push(...getNumberCompletions(partialValue, keyInfo.examples || []));
            break;
        case 'string':
            items.push(...getStringCompletions(partialValue, keyInfo.examples || []));
            break;
        case 'path':
            items.push(...getPathCompletions(partialValue));
            break;
        case 'percentage':
            items.push(...getPercentageCompletions(partialValue));
            break;
    }
    return items;
}
function getBooleanCompletions(partialValue) {
    const booleanValues = ['true', 'false', 'yes', 'no', 'on', 'off'];
    return booleanValues
        .filter(value => value.startsWith(partialValue.toLowerCase()))
        .map(value => ({
        label: value,
        kind: node_1.CompletionItemKind.Value,
        detail: `Boolean value: ${value}`,
        insertText: value
    }));
}
function getColorCompletions(partialValue) {
    const items = [];
    // Named colors
    const matchingColors = types_1.GHOSTTY_NAMED_COLORS.filter(color => color.startsWith(partialValue.toLowerCase()));
    items.push(...matchingColors.map(color => ({
        label: color,
        kind: node_1.CompletionItemKind.Color,
        detail: `Named color: ${color}`,
        insertText: color
    })));
    // Hex color suggestions
    if (partialValue.startsWith('#') || partialValue === '') {
        items.push({
            label: '#000000',
            kind: node_1.CompletionItemKind.Color,
            detail: 'Hex color (black)',
            insertText: '#000000'
        }, {
            label: '#FFFFFF',
            kind: node_1.CompletionItemKind.Color,
            detail: 'Hex color (white)',
            insertText: '#FFFFFF'
        }, {
            label: '#FF0000',
            kind: node_1.CompletionItemKind.Color,
            detail: 'Hex color (red)',
            insertText: '#FF0000'
        }, {
            label: '#00FF00',
            kind: node_1.CompletionItemKind.Color,
            detail: 'Hex color (green)',
            insertText: '#00FF00'
        }, {
            label: '#0000FF',
            kind: node_1.CompletionItemKind.Color,
            detail: 'Hex color (blue)',
            insertText: '#0000FF'
        });
    }
    return items;
}
function getEnumCompletions(partialValue, enumValues) {
    return enumValues
        .filter(value => value.startsWith(partialValue))
        .map(value => ({
        label: value,
        kind: node_1.CompletionItemKind.Enum,
        detail: `Enum value: ${value}`,
        insertText: value
    }));
}
function getThemeCompletions(partialValue) {
    const items = [];
    // Built-in themes
    const matchingThemes = types_1.GHOSTTY_BUILT_IN_THEMES.filter(theme => theme.startsWith(partialValue));
    items.push(...matchingThemes.map(theme => ({
        label: theme,
        kind: node_1.CompletionItemKind.Color,
        detail: `Built-in theme: ${theme}`,
        insertText: theme
    })));
    // Theme combinations
    if (partialValue === '' || partialValue.startsWith('light:') || partialValue.startsWith('dark:')) {
        items.push({
            label: 'light:catppuccin-latte,dark:catppuccin-frappe',
            kind: node_1.CompletionItemKind.Color,
            detail: 'Light/dark theme combination',
            insertText: 'light:catppuccin-latte,dark:catppuccin-frappe'
        });
    }
    return items;
}
function getKeybindCompletions(partialValue) {
    const items = [];
    // If empty or just starting, suggest common keybinds
    if (partialValue === '' || partialValue.length < 3) {
        items.push({
            label: 'ctrl+c=copy_to_clipboard',
            kind: node_1.CompletionItemKind.Value,
            detail: 'Copy to clipboard',
            insertText: 'ctrl+c=copy_to_clipboard'
        }, {
            label: 'ctrl+v=paste_from_clipboard',
            kind: node_1.CompletionItemKind.Value,
            detail: 'Paste from clipboard',
            insertText: 'ctrl+v=paste_from_clipboard'
        }, {
            label: 'ctrl+shift+t=new_tab',
            kind: node_1.CompletionItemKind.Value,
            detail: 'New tab',
            insertText: 'ctrl+shift+t=new_tab'
        }, {
            label: 'performable:ctrl+c=copy_to_clipboard',
            kind: node_1.CompletionItemKind.Value,
            detail: 'Performable copy (only if text is selected)',
            insertText: 'performable:ctrl+c=copy_to_clipboard'
        });
    }
    // Parse partial keybind and suggest completions
    if (partialValue.includes('=')) {
        const [trigger, action] = partialValue.split('=');
        if (action === '' || action.length < 3) {
            // Suggest actions
            items.push(...types_1.GHOSTTY_KEYBIND_ACTIONS.map(actionName => ({
                label: `${trigger}=${actionName}`,
                kind: node_1.CompletionItemKind.Function,
                detail: `Keybind action: ${actionName}`,
                insertText: `${trigger}=${actionName}`
            })));
        }
    }
    else {
        // Suggest modifiers
        const currentParts = partialValue.split('+');
        const lastPart = currentParts[currentParts.length - 1];
        if (lastPart === '' || types_1.GHOSTTY_MODIFIERS.some(mod => mod.startsWith(lastPart))) {
            const usedModifiers = currentParts.slice(0, -1);
            const availableModifiers = types_1.GHOSTTY_MODIFIERS.filter(mod => !usedModifiers.includes(mod) && mod.startsWith(lastPart));
            items.push(...availableModifiers.map(modifier => ({
                label: modifier,
                kind: node_1.CompletionItemKind.Keyword,
                detail: `Modifier key: ${modifier}`,
                insertText: modifier
            })));
        }
    }
    return items;
}
function getNumberCompletions(partialValue, examples) {
    const items = [];
    // Add examples
    items.push(...examples.map(example => ({
        label: example,
        kind: node_1.CompletionItemKind.Value,
        detail: `Example value: ${example}`,
        insertText: example
    })));
    // Add common number suggestions if no specific examples
    if (examples.length === 0) {
        items.push({
            label: '0',
            kind: node_1.CompletionItemKind.Value,
            detail: 'Number: 0',
            insertText: '0'
        }, {
            label: '1',
            kind: node_1.CompletionItemKind.Value,
            detail: 'Number: 1',
            insertText: '1'
        }, {
            label: '10',
            kind: node_1.CompletionItemKind.Value,
            detail: 'Number: 10',
            insertText: '10'
        });
    }
    return items;
}
function getStringCompletions(partialValue, examples) {
    return examples.map(example => ({
        label: example,
        kind: node_1.CompletionItemKind.Value,
        detail: `Example: ${example}`,
        insertText: example
    }));
}
function getPathCompletions(partialValue) {
    const items = [];
    // Common path suggestions
    items.push({
        label: '~/',
        kind: node_1.CompletionItemKind.Folder,
        detail: 'Home directory',
        insertText: '~/'
    }, {
        label: '~/.config/',
        kind: node_1.CompletionItemKind.Folder,
        detail: 'User config directory',
        insertText: '~/.config/'
    }, {
        label: '/usr/local/',
        kind: node_1.CompletionItemKind.Folder,
        detail: 'System local directory',
        insertText: '/usr/local/'
    });
    return items;
}
function getPercentageCompletions(partialValue) {
    const items = [];
    // Common percentage values
    const percentages = ['0%', '10%', '25%', '50%', '75%', '90%', '100%'];
    items.push(...percentages.map(percentage => ({
        label: percentage,
        kind: node_1.CompletionItemKind.Value,
        detail: `Percentage: ${percentage}`,
        insertText: percentage
    })));
    // Also suggest plain numbers
    items.push({
        label: '0',
        kind: node_1.CompletionItemKind.Value,
        detail: 'Number: 0',
        insertText: '0'
    }, {
        label: '1',
        kind: node_1.CompletionItemKind.Value,
        detail: 'Number: 1',
        insertText: '1'
    }, {
        label: '5',
        kind: node_1.CompletionItemKind.Value,
        detail: 'Number: 5',
        insertText: '5'
    });
    return items;
}
function formatKeyDocumentation(keyInfo) {
    let doc = `**${keyInfo.key}**\n\n${keyInfo.description}`;
    if (keyInfo.valueType) {
        doc += `\n\n**Type:** ${keyInfo.valueType}`;
    }
    if (keyInfo.enumValues && keyInfo.enumValues.length > 0) {
        doc += `\n\n**Valid values:** ${keyInfo.enumValues.join(', ')}`;
    }
    if (keyInfo.examples && keyInfo.examples.length > 0) {
        doc += `\n\n**Examples:**\n${keyInfo.examples.map((ex) => `- \`${ex}\``).join('\n')}`;
    }
    if (keyInfo.platforms && keyInfo.platforms.length > 0) {
        doc += `\n\n**Platforms:** ${keyInfo.platforms.join(', ')}`;
    }
    if (keyInfo.deprecated) {
        doc += `\n\n⚠️ **Deprecated**`;
    }
    return doc;
}
//# sourceMappingURL=completion.js.map