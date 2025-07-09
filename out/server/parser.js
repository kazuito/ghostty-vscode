"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGhosttyConfig = exports.GhosttyConfigParser = void 0;
const types_1 = require("../shared/types");
const schema_1 = require("../shared/schema");
class GhosttyConfigParser {
    constructor(content) {
        this.content = content;
        this.currentLine = 0;
        this.lines = content.split(/\r?\n/);
    }
    parse() {
        const result = {
            entries: [],
            comments: [],
            errors: []
        };
        this.currentLine = 0;
        for (let i = 0; i < this.lines.length; i++) {
            this.currentLine = i;
            const line = this.lines[i];
            const trimmedLine = line.trim();
            // Skip empty lines
            if (trimmedLine === '') {
                continue;
            }
            // Handle comments
            if (trimmedLine.startsWith('#')) {
                result.comments.push({
                    line: i,
                    text: trimmedLine,
                    range: { start: line.indexOf('#'), end: line.length }
                });
                continue;
            }
            // Parse key-value pairs
            const kvMatch = line.match(/^(\s*)([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*(.*?)\s*$/);
            if (kvMatch) {
                const [, indent, key, rawValue] = kvMatch;
                const keyStart = indent.length;
                const keyEnd = keyStart + key.length;
                const valueStart = line.indexOf('=') + 1;
                const valueEnd = line.length;
                // Find the actual value start (skip whitespace after =)
                const actualValueStart = valueStart + (rawValue.length > 0 ? line.substring(valueStart).indexOf(rawValue) : 0);
                try {
                    const parsedValue = this.parseValue(key, rawValue);
                    result.entries.push({
                        key,
                        value: parsedValue,
                        line: i,
                        keyRange: { start: keyStart, end: keyEnd },
                        valueRange: { start: actualValueStart, end: valueEnd }
                    });
                }
                catch (error) {
                    result.errors.push({
                        line: i,
                        message: error instanceof Error ? error.message : 'Failed to parse value',
                        range: { start: actualValueStart, end: valueEnd }
                    });
                }
                continue;
            }
            // If we reach here, it's an invalid line
            result.errors.push({
                line: i,
                message: 'Invalid configuration syntax. Expected "key = value" format.',
                range: { start: 0, end: line.length }
            });
        }
        return result;
    }
    parseValue(key, rawValue) {
        const keyInfo = (0, schema_1.getConfigKeyInfo)(key);
        if (!keyInfo) {
            return {
                type: 'string',
                value: rawValue,
                raw: rawValue
            };
        }
        switch (keyInfo.valueType) {
            case 'boolean':
                return this.parseBooleanValue(rawValue);
            case 'number':
                return this.parseNumberValue(rawValue);
            case 'color':
                return this.parseColorValue(rawValue);
            case 'enum':
                return this.parseEnumValue(rawValue, keyInfo.enumValues || []);
            case 'keybind':
                return this.parseKeybindValue(rawValue);
            case 'theme':
                return this.parseThemeValue(rawValue);
            case 'path':
                return this.parsePathValue(rawValue);
            case 'percentage':
                return this.parsePercentageValue(rawValue);
            default:
                return {
                    type: 'string',
                    value: rawValue,
                    raw: rawValue
                };
        }
    }
    parseBooleanValue(value) {
        const normalized = value.toLowerCase();
        const booleanValues = ['true', 'false', 'yes', 'no', 'on', 'off'];
        if (!booleanValues.includes(normalized)) {
            throw new Error(`Invalid boolean value: "${value}". Expected one of: ${booleanValues.join(', ')}`);
        }
        const boolValue = ['true', 'yes', 'on'].includes(normalized);
        return {
            type: 'boolean',
            value: boolValue.toString(),
            raw: value
        };
    }
    parseNumberValue(value) {
        const num = parseFloat(value);
        if (isNaN(num)) {
            throw new Error(`Invalid number value: "${value}"`);
        }
        return {
            type: 'number',
            value: num.toString(),
            raw: value
        };
    }
    parseColorValue(value) {
        // Check if it's a named color
        if (types_1.GHOSTTY_NAMED_COLORS.includes(value)) {
            return {
                type: 'color',
                value: value,
                raw: value
            };
        }
        // Check if it's a hex color
        const hexMatch = value.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
        if (hexMatch) {
            const hexValue = hexMatch[1];
            const normalizedHex = `#${hexValue}`;
            return {
                type: 'color',
                value: normalizedHex,
                raw: value
            };
        }
        // Check if it's a 6-digit hex without #
        const bareHexMatch = value.match(/^([0-9a-fA-F]{6})$/);
        if (bareHexMatch) {
            return {
                type: 'color',
                value: `#${bareHexMatch[1]}`,
                raw: value
            };
        }
        throw new Error(`Invalid color value: "${value}". Expected hex color (#RGB, #RRGGBB, #RRGGBBAA) or named color.`);
    }
    parseEnumValue(value, enumValues) {
        if (!enumValues.includes(value)) {
            throw new Error(`Invalid enum value: "${value}". Expected one of: ${enumValues.join(', ')}`);
        }
        return {
            type: 'enum',
            value: value,
            raw: value
        };
    }
    parseKeybindValue(value) {
        try {
            const parsed = this.parseKeybind(value);
            return {
                type: 'keybind',
                value: JSON.stringify(parsed),
                raw: value
            };
        }
        catch (error) {
            throw new Error(`Invalid keybind: "${value}". ${error instanceof Error ? error.message : 'Parse error'}`);
        }
    }
    parseKeybind(value) {
        // Check for sequence (contains >)
        if (value.includes('>')) {
            return this.parseKeybindSequence(value);
        }
        // Parse single keybind
        const parts = value.split('=');
        if (parts.length !== 2) {
            throw new Error('Keybind must be in format "trigger=action"');
        }
        const [triggerPart, actionPart] = parts;
        const trigger = this.parseKeybindTrigger(triggerPart.trim());
        const action = this.parseKeybindAction(actionPart.trim());
        return { trigger, action };
    }
    parseKeybindSequence(value) {
        const parts = value.split('=');
        if (parts.length !== 2) {
            throw new Error('Keybind sequence must be in format "trigger1>trigger2=action"');
        }
        const [triggerPart, actionPart] = parts;
        const triggers = triggerPart.split('>').map(t => this.parseKeybindTrigger(t.trim()));
        const action = this.parseKeybindAction(actionPart.trim());
        if (triggers.length < 2) {
            throw new Error('Keybind sequence must have at least 2 triggers');
        }
        return {
            trigger: triggers[0],
            action,
            sequence: triggers.slice(1)
        };
    }
    parseKeybindTrigger(trigger) {
        let remaining = trigger;
        let prefix;
        let physical = false;
        // Check for prefixes
        const prefixMatch = remaining.match(/^(global|performable|unconsumed|all):/);
        if (prefixMatch) {
            prefix = prefixMatch[1];
            remaining = remaining.substring(prefixMatch[0].length);
        }
        // Check for physical prefix
        if (remaining.startsWith('physical:')) {
            physical = true;
            remaining = remaining.substring('physical:'.length);
        }
        // Parse modifiers and key
        const parts = remaining.split('+');
        if (parts.length === 0) {
            throw new Error('Invalid keybind trigger format');
        }
        const key = parts[parts.length - 1];
        const modifiers = parts.slice(0, -1);
        // Validate modifiers
        for (const modifier of modifiers) {
            if (!types_1.GHOSTTY_MODIFIERS.includes(modifier)) {
                throw new Error(`Invalid modifier: ${modifier}. Valid modifiers: ${types_1.GHOSTTY_MODIFIERS.join(', ')}`);
            }
        }
        return {
            modifiers,
            key,
            prefix,
            physical
        };
    }
    parseKeybindAction(action) {
        const colonIndex = action.indexOf(':');
        if (colonIndex === -1) {
            // No parameter
            if (!types_1.GHOSTTY_KEYBIND_ACTIONS.includes(action)) {
                throw new Error(`Invalid keybind action: ${action}. Valid actions: ${types_1.GHOSTTY_KEYBIND_ACTIONS.join(', ')}`);
            }
            return { action };
        }
        const actionName = action.substring(0, colonIndex);
        const parameter = action.substring(colonIndex + 1);
        if (!types_1.GHOSTTY_KEYBIND_ACTIONS.includes(actionName)) {
            throw new Error(`Invalid keybind action: ${actionName}. Valid actions: ${types_1.GHOSTTY_KEYBIND_ACTIONS.join(', ')}`);
        }
        return { action: actionName, parameter };
    }
    parseThemeValue(value) {
        // Check if it's a built-in theme
        if (types_1.GHOSTTY_BUILT_IN_THEMES.includes(value)) {
            return {
                type: 'theme',
                value: value,
                raw: value
            };
        }
        // Check if it's a path (starts with / or ~)
        if (value.startsWith('/') || value.startsWith('~')) {
            return {
                type: 'theme',
                value: value,
                raw: value
            };
        }
        // Check if it's a light/dark combination
        const comboMatch = value.match(/^(light|dark):(.+),(?:light|dark):(.+)$/);
        if (comboMatch) {
            return {
                type: 'theme',
                value: value,
                raw: value
            };
        }
        // Simple light: or dark: prefix
        const prefixMatch = value.match(/^(light|dark):(.+)$/);
        if (prefixMatch) {
            return {
                type: 'theme',
                value: value,
                raw: value
            };
        }
        throw new Error(`Invalid theme value: "${value}". Expected built-in theme name, file path, or light/dark combination.`);
    }
    parsePathValue(value) {
        // Basic path validation - just check it's not empty
        if (value.trim() === '') {
            throw new Error('Path cannot be empty');
        }
        return {
            type: 'path',
            value: value,
            raw: value
        };
    }
    parsePercentageValue(value) {
        const match = value.match(/^(-?\d+(?:\.\d+)?)(%?)$/);
        if (!match) {
            throw new Error(`Invalid percentage value: "${value}". Expected number or percentage.`);
        }
        const [, numStr, percentSign] = match;
        const num = parseFloat(numStr);
        if (isNaN(num)) {
            throw new Error(`Invalid percentage value: "${value}"`);
        }
        return {
            type: 'percentage',
            value: percentSign ? `${num}%` : num.toString(),
            raw: value
        };
    }
}
exports.GhosttyConfigParser = GhosttyConfigParser;
function parseGhosttyConfig(content) {
    const parser = new GhosttyConfigParser(content);
    return parser.parse();
}
exports.parseGhosttyConfig = parseGhosttyConfig;
//# sourceMappingURL=parser.js.map