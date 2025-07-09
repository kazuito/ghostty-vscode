import {
  Hover,
  Position,
  Range,
  MarkupKind
} from 'vscode-languageserver/node';

import { getConfigKeyInfo } from '../shared/schema';
import { 
  GHOSTTY_BUILT_IN_THEMES,
  GHOSTTY_NAMED_COLORS,
  GHOSTTY_KEYBIND_ACTIONS,
  GHOSTTY_MODIFIERS
} from '../shared/types';

export function getHoverInfo(
  text: string,
  offset: number,
  position: Position
): Hover | undefined {
  const lines = text.split(/\r?\n/);
  const currentLine = lines[position.line];
  
  // Check if we're in a comment
  if (currentLine.trim().startsWith('#')) {
    return undefined;
  }

  // Parse the current line to identify what we're hovering over
  const keyValueMatch = currentLine.match(/^(\s*)([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*(.*?)$/);
  if (!keyValueMatch) {
    return undefined;
  }

  const [, indent, key, value] = keyValueMatch;
  const keyStart = indent.length;
  const keyEnd = keyStart + key.length;
  const valueStart = currentLine.indexOf('=') + 1;
  const valuePart = currentLine.substring(valueStart).trim();
  const valueActualStart = valueStart + (valuePart.length > 0 ? currentLine.substring(valueStart).indexOf(valuePart) : 0);
  const valueEnd = currentLine.length;

  // Determine if we're hovering over the key or value
  const character = position.character;
  
  if (character >= keyStart && character <= keyEnd) {
    // Hovering over key
    return getKeyHover(key, keyStart, keyEnd, position.line);
  } else if (character >= valueActualStart && character <= valueEnd) {
    // Hovering over value
    return getValueHover(key, valuePart, valueActualStart, valueEnd, position.line, character);
  }

  return undefined;
}

function getKeyHover(
  key: string,
  keyStart: number,
  keyEnd: number,
  line: number
): Hover | undefined {
  const keyInfo = getConfigKeyInfo(key);
  if (!keyInfo) {
    return undefined;
  }

  const range = Range.create(line, keyStart, line, keyEnd);
  const documentation = formatKeyDocumentation(keyInfo);

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: documentation
    },
    range
  };
}

function getValueHover(
  key: string,
  value: string,
  valueStart: number,
  valueEnd: number,
  line: number,
  character: number
): Hover | undefined {
  const keyInfo = getConfigKeyInfo(key);
  if (!keyInfo) {
    return undefined;
  }

  const range = Range.create(line, valueStart, line, valueEnd);
  let documentation = '';

  // Provide context-specific hover information based on value type
  switch (keyInfo.valueType) {
    case 'boolean':
      documentation = getBooleanValueHover(value);
      break;
    case 'color':
      documentation = getColorValueHover(value);
      break;
    case 'enum':
      documentation = getEnumValueHover(value, keyInfo.enumValues || []);
      break;
    case 'theme':
      documentation = getThemeValueHover(value);
      break;
    case 'keybind':
      documentation = getKeybindValueHover(value);
      break;
    case 'number':
      documentation = getNumberValueHover(value);
      break;
    case 'percentage':
      documentation = getPercentageValueHover(value);
      break;
    default:
      documentation = getGenericValueHover(value, keyInfo);
  }

  if (!documentation) {
    return undefined;
  }

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: documentation
    },
    range
  };
}

function getBooleanValueHover(value: string): string {
  const normalized = value.toLowerCase();
  const isTrue = ['true', 'yes', 'on'].includes(normalized);
  const isFalse = ['false', 'no', 'off'].includes(normalized);
  
  if (isTrue) {
    return `**Boolean Value: \`${value}\`**\n\nThis evaluates to \`true\` and enables the feature.`;
  } else if (isFalse) {
    return `**Boolean Value: \`${value}\`**\n\nThis evaluates to \`false\` and disables the feature.`;
  } else {
    return `**Invalid Boolean Value: \`${value}\`**\n\nValid boolean values are: \`true\`, \`false\`, \`yes\`, \`no\`, \`on\`, \`off\`.`;
  }
}

function getColorValueHover(value: string): string {
  // Check if it's a named color
  if (GHOSTTY_NAMED_COLORS.includes(value as any)) {
    return `**Named Color: \`${value}\`**\n\nThis is a predefined color name supported by Ghostty.`;
  }

  // Check if it's a hex color
  const hexMatch = value.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
  if (hexMatch) {
    const hexValue = hexMatch[1];
    let description = `**Hex Color: \`${value}\`**\n\n`;
    
    if (hexValue.length === 3) {
      description += 'This is a 3-digit hex color (RGB shorthand).';
    } else if (hexValue.length === 6) {
      description += 'This is a 6-digit hex color (RGB).';
    } else if (hexValue.length === 8) {
      description += 'This is an 8-digit hex color (RGBA with alpha channel).';
    }
    
    return description;
  }

  // Check if it's a 6-digit hex without #
  const bareHexMatch = value.match(/^([0-9a-fA-F]{6})$/);
  if (bareHexMatch) {
    return `**Hex Color: \`${value}\`**\n\nThis is a 6-digit hex color without the # prefix. It will be interpreted as RGB.`;
  }

  return `**Invalid Color: \`${value}\`**\n\nValid color formats: hex colors (#RGB, #RRGGBB, #RRGGBBAA) or named colors.`;
}

function getEnumValueHover(value: string, enumValues: string[]): string {
  if (enumValues.includes(value)) {
    return `**Enum Value: \`${value}\`**\n\nThis is a valid option for this configuration key.\n\n**All valid values:** ${enumValues.join(', ')}`;
  } else {
    return `**Invalid Enum Value: \`${value}\`**\n\nValid values are: ${enumValues.join(', ')}`;
  }
}

function getThemeValueHover(value: string): string {
  // Check if it's a built-in theme
  if (GHOSTTY_BUILT_IN_THEMES.includes(value as any)) {
    return `**Built-in Theme: \`${value}\`**\n\nThis is a built-in theme provided by Ghostty.`;
  }

  // Check if it's a file path
  if (value.startsWith('/') || value.startsWith('~')) {
    return `**Theme File: \`${value}\`**\n\nThis points to a custom theme file.`;
  }

  // Check if it's a light/dark combination
  const comboMatch = value.match(/^(light|dark):(.+),(light|dark):(.+)$/);
  if (comboMatch) {
    return `**Light/Dark Theme Combination: \`${value}\`**\n\nThis sets different themes for light and dark mode.`;
  }

  // Check if it's a single light/dark theme
  const prefixMatch = value.match(/^(light|dark):(.+)$/);
  if (prefixMatch) {
    return `**${prefixMatch[1]} Theme: \`${value}\`**\n\nThis sets a theme specifically for ${prefixMatch[1]} mode.`;
  }

  return `**Theme Value: \`${value}\`**\n\nThis should be a built-in theme name, file path, or light/dark combination.`;
}

function getKeybindValueHover(value: string): string {
  try {
    const parts = value.split('=');
    if (parts.length !== 2) {
      return `**Invalid Keybind: \`${value}\`**\n\nKeybinds must be in format "trigger=action".`;
    }

    const [trigger, action] = parts;
    let documentation = `**Keybind: \`${value}\`**\n\n`;

    // Parse trigger
    let triggerPart = trigger.trim();
    let prefix = '';
    
    // Check for prefixes
    const prefixMatch = triggerPart.match(/^(global|performable|unconsumed|all):/);
    if (prefixMatch) {
      prefix = prefixMatch[1];
      triggerPart = triggerPart.substring(prefixMatch[0].length);
      
      switch (prefix) {
        case 'global':
          documentation += '**Global keybind** - Works in all contexts.\n\n';
          break;
        case 'performable':
          documentation += '**Performable keybind** - Only consumes input if action can be performed.\n\n';
          break;
        case 'unconsumed':
          documentation += '**Unconsumed keybind** - Doesn\'t consume the key event.\n\n';
          break;
        case 'all':
          documentation += '**All keybind** - Applies to all surfaces.\n\n';
          break;
      }
    }

    // Parse action
    const actionPart = action.trim();
    const colonIndex = actionPart.indexOf(':');
    const actionName = colonIndex === -1 ? actionPart : actionPart.substring(0, colonIndex);
    const parameter = colonIndex === -1 ? '' : actionPart.substring(colonIndex + 1);

    if (GHOSTTY_KEYBIND_ACTIONS.includes(actionName as any)) {
      documentation += `**Action:** \`${actionName}\``;
      if (parameter) {
        documentation += `\n**Parameter:** \`${parameter}\``;
      }
      documentation += `\n\n**Trigger:** \`${triggerPart}\``;
    } else {
      documentation += `**Invalid action:** \`${actionName}\`\n\nValid actions: ${GHOSTTY_KEYBIND_ACTIONS.join(', ')}`;
    }

    return documentation;
  } catch (error) {
    return `**Invalid Keybind: \`${value}\`**\n\nKeybinds must be in format "trigger=action".`;
  }
}

function getNumberValueHover(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return `**Invalid Number: \`${value}\`**\n\nThis should be a valid number.`;
  }

  return `**Number Value: \`${value}\`**\n\nThis is a numeric value (${num}).`;
}

function getPercentageValueHover(value: string): string {
  const match = value.match(/^(-?\d+(?:\.\d+)?)(%?)$/);
  if (!match) {
    return `**Invalid Percentage: \`${value}\`**\n\nThis should be a number or percentage.`;
  }

  const [, numStr, percentSign] = match;
  const num = parseFloat(numStr);
  
  if (percentSign) {
    return `**Percentage Value: \`${value}\`**\n\nThis is a percentage value (${num}%).`;
  } else {
    return `**Numeric Value: \`${value}\`**\n\nThis is a numeric value (${num}).`;
  }
}

function getGenericValueHover(value: string, keyInfo: any): string {
  let documentation = `**Value: \`${value}\`**\n\n`;
  
  if (keyInfo.examples && keyInfo.examples.includes(value)) {
    documentation += 'This is an example value from the documentation.\n\n';
  }
  
  documentation += `**Type:** ${keyInfo.valueType}`;
  
  if (keyInfo.description) {
    documentation += `\n\n${keyInfo.description}`;
  }
  
  return documentation;
}

function formatKeyDocumentation(keyInfo: any): string {
  let doc = `**Configuration Key: \`${keyInfo.key}\`**\n\n${keyInfo.description}`;
  
  if (keyInfo.valueType) {
    doc += `\n\n**Value Type:** ${keyInfo.valueType}`;
  }
  
  if (keyInfo.enumValues && keyInfo.enumValues.length > 0) {
    doc += `\n\n**Valid Values:**\n${keyInfo.enumValues.map((val: string) => `- \`${val}\``).join('\n')}`;
  }
  
  if (keyInfo.examples && keyInfo.examples.length > 0) {
    doc += `\n\n**Examples:**\n${keyInfo.examples.map((ex: string) => `- \`${ex}\``).join('\n')}`;
  }
  
  if (keyInfo.platforms && keyInfo.platforms.length > 0) {
    doc += `\n\n**Platforms:** ${keyInfo.platforms.join(', ')}`;
  }
  
  if (keyInfo.deprecated) {
    doc += `\n\n⚠️ **Deprecated** - This configuration key is deprecated and may be removed in future versions.`;
  }
  
  return doc;
}