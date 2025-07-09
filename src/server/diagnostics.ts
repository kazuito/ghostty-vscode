import {
  Diagnostic,
  DiagnosticSeverity,
  Range
} from 'vscode-languageserver/node';

import { parseGhosttyConfig } from './parser';
import { getConfigKeyInfo } from '../shared/schema';

export function getDiagnostics(text: string, maxProblems: number): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const parsed = parseGhosttyConfig(text);
  const lines = text.split(/\r?\n/);

  // Add parser errors as diagnostics
  for (const error of parsed.errors) {
    if (diagnostics.length >= maxProblems) {
      break;
    }

    const range = Range.create(
      error.line,
      error.range.start,
      error.line,
      error.range.end
    );

    diagnostics.push({
      severity: DiagnosticSeverity.Error,
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

    const keyInfo = getConfigKeyInfo(entry.key);
    
    // Check for unknown configuration keys
    if (!keyInfo) {
      const range = Range.create(
        entry.line,
        entry.keyRange.start,
        entry.line,
        entry.keyRange.end
      );

      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range,
        message: `Unknown configuration key: '${entry.key}'`,
        source: 'ghostty'
      });
      continue;
    }

    // Check for deprecated keys
    if (keyInfo.deprecated) {
      const range = Range.create(
        entry.line,
        entry.keyRange.start,
        entry.line,
        entry.keyRange.end
      );

      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range,
        message: `Configuration key '${entry.key}' is deprecated`,
        source: 'ghostty'
      });
    }

    // Validate value types
    const valueValidation = validateValue(entry.key, entry.value, keyInfo);
    if (valueValidation) {
      const range = Range.create(
        entry.line,
        entry.valueRange.start,
        entry.line,
        entry.valueRange.end
      );

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
        const range = Range.create(
          entry.line,
          entry.keyRange.start,
          entry.line,
          entry.keyRange.end
        );

        diagnostics.push({
          severity: DiagnosticSeverity.Information,
          range,
          message: `Configuration key '${entry.key}' is only supported on: ${keyInfo.platforms.join(', ')}`,
          source: 'ghostty'
        });
      }
    }
  }

  // Check for duplicate keys
  const keyOccurrences = new Map<string, number[]>();
  for (const entry of parsed.entries) {
    if (!keyOccurrences.has(entry.key)) {
      keyOccurrences.set(entry.key, []);
    }
    keyOccurrences.get(entry.key)!.push(entry.line);
  }

  for (const [key, lines] of keyOccurrences) {
    if (lines.length > 1) {
      for (let i = 1; i < lines.length; i++) {
        if (diagnostics.length >= maxProblems) {
          break;
        }

        const entry = parsed.entries.find(e => e.key === key && e.line === lines[i]);
        if (entry) {
          const range = Range.create(
            entry.line,
            entry.keyRange.start,
            entry.line,
            entry.keyRange.end
          );

          diagnostics.push({
            severity: DiagnosticSeverity.Warning,
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

interface ValidationResult {
  severity: DiagnosticSeverity;
  message: string;
}

function validateValue(key: string, value: any, keyInfo: any): ValidationResult | null {
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

function validateColorValue(value: string): ValidationResult | null {
  // Basic color validation - more detailed validation could be added
  if (value.startsWith('#') && value.length > 1) {
    const hex = value.substring(1);
    if (!/^[0-9a-fA-F]+$/.test(hex)) {
      return {
        severity: DiagnosticSeverity.Error,
        message: 'Invalid hex color format'
      };
    }
    if (![3, 6, 8].includes(hex.length)) {
      return {
        severity: DiagnosticSeverity.Error,
        message: 'Hex color must be 3, 6, or 8 characters long'
      };
    }
  }
  return null;
}

function validateNumberValue(value: string, keyInfo: any): ValidationResult | null {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return {
      severity: DiagnosticSeverity.Error,
      message: 'Invalid number format'
    };
  }

  // Add range validation if needed
  if (keyInfo.key === 'background-opacity' || keyInfo.key === 'cursor-opacity') {
    if (num < 0 || num > 1) {
      return {
        severity: DiagnosticSeverity.Error,
        message: 'Opacity values must be between 0.0 and 1.0'
      };
    }
  }

  if (keyInfo.key === 'font-size' && num <= 0) {
    return {
      severity: DiagnosticSeverity.Error,
      message: 'Font size must be greater than 0'
    };
  }

  return null;
}

function validateEnumValue(value: string, enumValues: string[]): ValidationResult | null {
  if (enumValues.length > 0 && !enumValues.includes(value)) {
    return {
      severity: DiagnosticSeverity.Error,
      message: `Invalid value '${value}'. Valid values are: ${enumValues.join(', ')}`
    };
  }
  return null;
}

function validateKeybindValue(value: string): ValidationResult | null {
  // Basic keybind validation
  if (!value.includes('=')) {
    return {
      severity: DiagnosticSeverity.Error,
      message: 'Keybind must contain = separator'
    };
  }

  const parts = value.split('=');
  if (parts.length !== 2) {
    return {
      severity: DiagnosticSeverity.Error,
      message: 'Keybind must be in format "trigger=action"'
    };
  }

  const [trigger, action] = parts;
  if (!trigger.trim()) {
    return {
      severity: DiagnosticSeverity.Error,
      message: 'Keybind trigger cannot be empty'
    };
  }

  if (!action.trim()) {
    return {
      severity: DiagnosticSeverity.Error,
      message: 'Keybind action cannot be empty'
    };
  }

  return null;
}

function validateThemeValue(value: string): ValidationResult | null {
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
        severity: DiagnosticSeverity.Error,
        message: 'Light and dark themes must be different modes'
      };
    }
  }

  return null;
}

function validatePathValue(value: string): ValidationResult | null {
  if (value.trim() === '') {
    return {
      severity: DiagnosticSeverity.Error,
      message: 'Path cannot be empty'
    };
  }
  return null;
}

function validatePercentageValue(value: string): ValidationResult | null {
  const match = value.match(/^(-?\d+(?:\.\d+)?)(%?)$/);
  if (!match) {
    return {
      severity: DiagnosticSeverity.Error,
      message: 'Invalid percentage format'
    };
  }

  const num = parseFloat(match[1]);
  if (isNaN(num)) {
    return {
      severity: DiagnosticSeverity.Error,
      message: 'Invalid number in percentage'
    };
  }

  return null;
}

function validateBooleanValue(value: string): ValidationResult | null {
  const validValues = ['true', 'false', 'yes', 'no', 'on', 'off'];
  if (!validValues.includes(value.toLowerCase())) {
    return {
      severity: DiagnosticSeverity.Error,
      message: `Invalid boolean value '${value}'. Valid values are: ${validValues.join(', ')}`
    };
  }
  return null;
}

function getCurrentPlatform(): 'macos' | 'linux' | 'windows' | null {
  // In a real implementation, this would detect the current platform
  // For now, we'll return null to skip platform-specific validation
  return null;
}