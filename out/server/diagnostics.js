"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDiagnostics = void 0;
const node_1 = require("vscode-languageserver/node");
const parser_1 = require("./parser");
const schema_1 = require("../shared/schema");
function getDiagnostics(text, maxProblems) {
    const diagnostics = [];
    const parsed = (0, parser_1.parseGhosttyConfig)(text);
    const lines = text.split(/\r?\n/);
    // Add parser errors as diagnostics
    for (const error of parsed.errors) {
        if (diagnostics.length >= maxProblems) {
            break;
        }
        const range = node_1.Range.create(error.line, error.range.start, error.line, error.range.end);
        diagnostics.push({
            severity: node_1.DiagnosticSeverity.Error,
            range,
            message: error.message,
            source: 'ghostty'
        });
    }
    // Validate configuration entries
    for (const entry of parsed.entries) {
        if (diagnostics.length >= maxProblems) {
            break;
        }
        const keyInfo = (0, schema_1.getConfigKeyInfo)(entry.key);
        // Check for unknown configuration keys
        if (!keyInfo) {
            const range = node_1.Range.create(entry.line, entry.keyRange.start, entry.line, entry.keyRange.end);
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Warning,
                range,
                message: `Unknown configuration key: '${entry.key}'`,
                source: 'ghostty'
            });
            continue;
        }
        // Check for deprecated keys
        if (keyInfo.deprecated) {
            const range = node_1.Range.create(entry.line, entry.keyRange.start, entry.line, entry.keyRange.end);
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Warning,
                range,
                message: `Configuration key '${entry.key}' is deprecated`,
                source: 'ghostty'
            });
        }
        // Validate value types
        const valueValidation = validateValue(entry.key, entry.value, keyInfo);
        if (valueValidation) {
            const range = node_1.Range.create(entry.line, entry.valueRange.start, entry.line, entry.valueRange.end);
            diagnostics.push({
                severity: valueValidation.severity,
                range,
                message: valueValidation.message,
                source: 'ghostty'
            });
        }
        // Check platform-specific keys
        if (keyInfo.platforms && keyInfo.platforms.length > 0) {
            const currentPlatform = getCurrentPlatform();
            if (currentPlatform && !keyInfo.platforms.includes(currentPlatform)) {
                const range = node_1.Range.create(entry.line, entry.keyRange.start, entry.line, entry.keyRange.end);
                diagnostics.push({
                    severity: node_1.DiagnosticSeverity.Information,
                    range,
                    message: `Configuration key '${entry.key}' is only supported on: ${keyInfo.platforms.join(', ')}`,
                    source: 'ghostty'
                });
            }
        }
    }
    // Check for duplicate keys
    const keyOccurrences = new Map();
    for (const entry of parsed.entries) {
        if (!keyOccurrences.has(entry.key)) {
            keyOccurrences.set(entry.key, []);
        }
        keyOccurrences.get(entry.key).push(entry.line);
    }
    for (const [key, lines] of keyOccurrences) {
        if (lines.length > 1) {
            for (let i = 1; i < lines.length; i++) {
                if (diagnostics.length >= maxProblems) {
                    break;
                }
                const entry = parsed.entries.find(e => e.key === key && e.line === lines[i]);
                if (entry) {
                    const range = node_1.Range.create(entry.line, entry.keyRange.start, entry.line, entry.keyRange.end);
                    diagnostics.push({
                        severity: node_1.DiagnosticSeverity.Warning,
                        range,
                        message: `Duplicate configuration key '${key}' (first occurrence at line ${lines[0] + 1})`,
                        source: 'ghostty'
                    });
                }
            }
        }
    }
    return diagnostics;
}
exports.getDiagnostics = getDiagnostics;
function validateValue(key, value, keyInfo) {
    // If the parser successfully parsed the value, basic validation passed
    // Here we can add more sophisticated validation
    switch (keyInfo.valueType) {
        case 'color':
            return validateColorValue(value.raw);
        case 'number':
            return validateNumberValue(value.raw, keyInfo);
        case 'enum':
            return validateEnumValue(value.raw, keyInfo.enumValues || []);
        case 'keybind':
            return validateKeybindValue(value.raw);
        case 'theme':
            return validateThemeValue(value.raw);
        case 'path':
            return validatePathValue(value.raw);
        case 'percentage':
            return validatePercentageValue(value.raw);
        case 'boolean':
            return validateBooleanValue(value.raw);
        default:
            return null;
    }
}
function validateColorValue(value) {
    // Basic color validation - more detailed validation could be added
    if (value.startsWith('#') && value.length > 1) {
        const hex = value.substring(1);
        if (!/^[0-9a-fA-F]+$/.test(hex)) {
            return {
                severity: node_1.DiagnosticSeverity.Error,
                message: 'Invalid hex color format'
            };
        }
        if (![3, 6, 8].includes(hex.length)) {
            return {
                severity: node_1.DiagnosticSeverity.Error,
                message: 'Hex color must be 3, 6, or 8 characters long'
            };
        }
    }
    return null;
}
function validateNumberValue(value, keyInfo) {
    const num = parseFloat(value);
    if (isNaN(num)) {
        return {
            severity: node_1.DiagnosticSeverity.Error,
            message: 'Invalid number format'
        };
    }
    // Add range validation if needed
    if (keyInfo.key === 'background-opacity' || keyInfo.key === 'cursor-opacity') {
        if (num < 0 || num > 1) {
            return {
                severity: node_1.DiagnosticSeverity.Error,
                message: 'Opacity values must be between 0.0 and 1.0'
            };
        }
    }
    if (keyInfo.key === 'font-size' && num <= 0) {
        return {
            severity: node_1.DiagnosticSeverity.Error,
            message: 'Font size must be greater than 0'
        };
    }
    return null;
}
function validateEnumValue(value, enumValues) {
    if (enumValues.length > 0 && !enumValues.includes(value)) {
        return {
            severity: node_1.DiagnosticSeverity.Error,
            message: `Invalid value '${value}'. Valid values are: ${enumValues.join(', ')}`
        };
    }
    return null;
}
function validateKeybindValue(value) {
    // Basic keybind validation
    if (!value.includes('=')) {
        return {
            severity: node_1.DiagnosticSeverity.Error,
            message: 'Keybind must contain = separator'
        };
    }
    const parts = value.split('=');
    if (parts.length !== 2) {
        return {
            severity: node_1.DiagnosticSeverity.Error,
            message: 'Keybind must be in format "trigger=action"'
        };
    }
    const [trigger, action] = parts;
    if (!trigger.trim()) {
        return {
            severity: node_1.DiagnosticSeverity.Error,
            message: 'Keybind trigger cannot be empty'
        };
    }
    if (!action.trim()) {
        return {
            severity: node_1.DiagnosticSeverity.Error,
            message: 'Keybind action cannot be empty'
        };
    }
    return null;
}
function validateThemeValue(value) {
    // Theme validation - could check if file exists for file paths
    if (value.startsWith('/') || value.startsWith('~')) {
        // File path - we could check if it exists, but that might be expensive
        return null;
    }
    // Check for valid theme combination syntax
    const comboMatch = value.match(/^(light|dark):(.+),(light|dark):(.+)$/);
    if (comboMatch) {
        const [, mode1, theme1, mode2, theme2] = comboMatch;
        if (mode1 === mode2) {
            return {
                severity: node_1.DiagnosticSeverity.Error,
                message: 'Light and dark themes must be different modes'
            };
        }
    }
    return null;
}
function validatePathValue(value) {
    if (value.trim() === '') {
        return {
            severity: node_1.DiagnosticSeverity.Error,
            message: 'Path cannot be empty'
        };
    }
    return null;
}
function validatePercentageValue(value) {
    const match = value.match(/^(-?\d+(?:\.\d+)?)(%?)$/);
    if (!match) {
        return {
            severity: node_1.DiagnosticSeverity.Error,
            message: 'Invalid percentage format'
        };
    }
    const num = parseFloat(match[1]);
    if (isNaN(num)) {
        return {
            severity: node_1.DiagnosticSeverity.Error,
            message: 'Invalid number in percentage'
        };
    }
    return null;
}
function validateBooleanValue(value) {
    const validValues = ['true', 'false', 'yes', 'no', 'on', 'off'];
    if (!validValues.includes(value.toLowerCase())) {
        return {
            severity: node_1.DiagnosticSeverity.Error,
            message: `Invalid boolean value '${value}'. Valid values are: ${validValues.join(', ')}`
        };
    }
    return null;
}
function getCurrentPlatform() {
    // In a real implementation, this would detect the current platform
    // For now, we'll return null to skip platform-specific validation
    return null;
}
//# sourceMappingURL=diagnostics.js.map