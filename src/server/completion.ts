import {
  CompletionItem,
  CompletionItemKind,
  Position,
  InsertTextFormat,
  MarkupKind
} from 'vscode-languageserver/node';

import { 
  GHOSTTY_CONFIG_SCHEMA, 
  getConfigKeyInfo, 
  getAllConfigKeys 
} from '../shared/schema';
import { 
  GHOSTTY_BUILT_IN_THEMES,
  GHOSTTY_MODIFIERS,
  GHOSTTY_KEYBIND_ACTIONS,
  GHOSTTY_NAMED_COLORS 
} from '../shared/types';
import { parseGhosttyConfig } from './parser';

export function getCompletionItems(
  text: string,
  offset: number,
  position: Position
): CompletionItem[] {
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

function getKeyCompletions(beforeCursor: string): CompletionItem[] {
  const trimmed = beforeCursor.trim();
  const items: CompletionItem[] = [];

  // Filter keys that start with the current input
  const matchingKeys = getAllConfigKeys().filter(key => 
    key.startsWith(trimmed) || trimmed === ''
  );

  for (const key of matchingKeys) {
    const keyInfo = getConfigKeyInfo(key);
    if (!keyInfo) continue;

    let insertText = key;
    let detail = keyInfo.description;
    
    // Add example value in snippet
    if (keyInfo.examples && keyInfo.examples.length > 0) {
      insertText = `${key} = ${keyInfo.examples[0]}`;
      detail += `\n\nExample: ${keyInfo.examples[0]}`;
    } else {
      insertText = `${key} = `;
    }

    items.push({
      label: key,
      kind: CompletionItemKind.Property,
      detail: detail,
      documentation: {
        kind: MarkupKind.Markdown,
        value: formatKeyDocumentation(keyInfo)
      },
      insertText: insertText,
      insertTextFormat: InsertTextFormat.PlainText
    });
  }

  return items;
}

function getValueCompletions(key: string, partialValue: string): CompletionItem[] {
  const keyInfo = getConfigKeyInfo(key);
  if (!keyInfo) {
    return [];
  }

  const items: CompletionItem[] = [];

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

function getBooleanCompletions(partialValue: string): CompletionItem[] {
  const booleanValues = ['true', 'false', 'yes', 'no', 'on', 'off'];
  return booleanValues
    .filter(value => value.startsWith(partialValue.toLowerCase()))
    .map(value => ({
      label: value,
      kind: CompletionItemKind.Value,
      detail: `Boolean value: ${value}`,
      insertText: value
    }));
}

function getColorCompletions(partialValue: string): CompletionItem[] {
  const items: CompletionItem[] = [];
  
  // Named colors
  const matchingColors = GHOSTTY_NAMED_COLORS.filter(color => 
    color.startsWith(partialValue.toLowerCase())
  );
  
  items.push(...matchingColors.map(color => ({
    label: color,
    kind: CompletionItemKind.Color,
    detail: `Named color: ${color}`,
    insertText: color
  })));

  // Hex color suggestions
  if (partialValue.startsWith('#') || partialValue === '') {
    items.push(
      {
        label: '#000000',
        kind: CompletionItemKind.Color,
        detail: 'Hex color (black)',
        insertText: '#000000'
      },
      {
        label: '#FFFFFF',
        kind: CompletionItemKind.Color,
        detail: 'Hex color (white)',
        insertText: '#FFFFFF'
      },
      {
        label: '#FF0000',
        kind: CompletionItemKind.Color,
        detail: 'Hex color (red)',
        insertText: '#FF0000'
      },
      {
        label: '#00FF00',
        kind: CompletionItemKind.Color,
        detail: 'Hex color (green)',
        insertText: '#00FF00'
      },
      {
        label: '#0000FF',
        kind: CompletionItemKind.Color,
        detail: 'Hex color (blue)',
        insertText: '#0000FF'
      }
    );
  }

  return items;
}

function getEnumCompletions(partialValue: string, enumValues: string[]): CompletionItem[] {
  return enumValues
    .filter(value => value.startsWith(partialValue))
    .map(value => ({
      label: value,
      kind: CompletionItemKind.Enum,
      detail: `Enum value: ${value}`,
      insertText: value
    }));
}

function getThemeCompletions(partialValue: string): CompletionItem[] {
  const items: CompletionItem[] = [];
  
  // Built-in themes
  const matchingThemes = GHOSTTY_BUILT_IN_THEMES.filter(theme => 
    theme.startsWith(partialValue)
  );
  
  items.push(...matchingThemes.map(theme => ({
    label: theme,
    kind: CompletionItemKind.Color,
    detail: `Built-in theme: ${theme}`,
    insertText: theme
  })));

  // Theme combinations
  if (partialValue === '' || partialValue.startsWith('light:') || partialValue.startsWith('dark:')) {
    items.push({
      label: 'light:catppuccin-latte,dark:catppuccin-frappe',
      kind: CompletionItemKind.Color,
      detail: 'Light/dark theme combination',
      insertText: 'light:catppuccin-latte,dark:catppuccin-frappe'
    });
  }

  return items;
}

function getKeybindCompletions(partialValue: string): CompletionItem[] {
  const items: CompletionItem[] = [];
  
  // If empty or just starting, suggest common keybinds
  if (partialValue === '' || partialValue.length < 3) {
    items.push(
      {
        label: 'ctrl+c=copy_to_clipboard',
        kind: CompletionItemKind.Value,
        detail: 'Copy to clipboard',
        insertText: 'ctrl+c=copy_to_clipboard'
      },
      {
        label: 'ctrl+v=paste_from_clipboard',
        kind: CompletionItemKind.Value,
        detail: 'Paste from clipboard',
        insertText: 'ctrl+v=paste_from_clipboard'
      },
      {
        label: 'ctrl+shift+t=new_tab',
        kind: CompletionItemKind.Value,
        detail: 'New tab',
        insertText: 'ctrl+shift+t=new_tab'
      },
      {
        label: 'performable:ctrl+c=copy_to_clipboard',
        kind: CompletionItemKind.Value,
        detail: 'Performable copy (only if text is selected)',
        insertText: 'performable:ctrl+c=copy_to_clipboard'
      }
    );
  }

  // Parse partial keybind and suggest completions
  if (partialValue.includes('=')) {
    const [trigger, action] = partialValue.split('=');
    if (action === '' || action.length < 3) {
      // Suggest actions
      items.push(...GHOSTTY_KEYBIND_ACTIONS.map(actionName => ({
        label: `${trigger}=${actionName}`,
        kind: CompletionItemKind.Function,
        detail: `Keybind action: ${actionName}`,
        insertText: `${trigger}=${actionName}`
      })));
    }
  } else {
    // Suggest modifiers
    const currentParts = partialValue.split('+');
    const lastPart = currentParts[currentParts.length - 1];
    
    if (lastPart === '' || GHOSTTY_MODIFIERS.some(mod => mod.startsWith(lastPart))) {
      const usedModifiers = currentParts.slice(0, -1);
      const availableModifiers = GHOSTTY_MODIFIERS.filter(mod => 
        !usedModifiers.includes(mod) && mod.startsWith(lastPart)
      );
      
      items.push(...availableModifiers.map(modifier => ({
        label: modifier,
        kind: CompletionItemKind.Keyword,
        detail: `Modifier key: ${modifier}`,
        insertText: modifier
      })));
    }
  }

  return items;
}

function getNumberCompletions(partialValue: string, examples: string[]): CompletionItem[] {
  const items: CompletionItem[] = [];
  
  // Add examples
  items.push(...examples.map(example => ({
    label: example,
    kind: CompletionItemKind.Value,
    detail: `Example value: ${example}`,
    insertText: example
  })));

  // Add common number suggestions if no specific examples
  if (examples.length === 0) {
    items.push(
      {
        label: '0',
        kind: CompletionItemKind.Value,
        detail: 'Number: 0',
        insertText: '0'
      },
      {
        label: '1',
        kind: CompletionItemKind.Value,
        detail: 'Number: 1',
        insertText: '1'
      },
      {
        label: '10',
        kind: CompletionItemKind.Value,
        detail: 'Number: 10',
        insertText: '10'
      }
    );
  }

  return items;
}

function getStringCompletions(partialValue: string, examples: string[]): CompletionItem[] {
  return examples.map(example => ({
    label: example,
    kind: CompletionItemKind.Value,
    detail: `Example: ${example}`,
    insertText: example
  }));
}

function getPathCompletions(partialValue: string): CompletionItem[] {
  const items: CompletionItem[] = [];
  
  // Common path suggestions
  items.push(
    {
      label: '~/',
      kind: CompletionItemKind.Folder,
      detail: 'Home directory',
      insertText: '~/'
    },
    {
      label: '~/.config/',
      kind: CompletionItemKind.Folder,
      detail: 'User config directory',
      insertText: '~/.config/'
    },
    {
      label: '/usr/local/',
      kind: CompletionItemKind.Folder,
      detail: 'System local directory',
      insertText: '/usr/local/'
    }
  );

  return items;
}

function getPercentageCompletions(partialValue: string): CompletionItem[] {
  const items: CompletionItem[] = [];
  
  // Common percentage values
  const percentages = ['0%', '10%', '25%', '50%', '75%', '90%', '100%'];
  
  items.push(...percentages.map(percentage => ({
    label: percentage,
    kind: CompletionItemKind.Value,
    detail: `Percentage: ${percentage}`,
    insertText: percentage
  })));

  // Also suggest plain numbers
  items.push(
    {
      label: '0',
      kind: CompletionItemKind.Value,
      detail: 'Number: 0',
      insertText: '0'
    },
    {
      label: '1',
      kind: CompletionItemKind.Value,
      detail: 'Number: 1',
      insertText: '1'
    },
    {
      label: '5',
      kind: CompletionItemKind.Value,
      detail: 'Number: 5',
      insertText: '5'
    }
  );

  return items;
}

function formatKeyDocumentation(keyInfo: any): string {
  let doc = `**${keyInfo.key}**\n\n${keyInfo.description}`;
  
  if (keyInfo.valueType) {
    doc += `\n\n**Type:** ${keyInfo.valueType}`;
  }
  
  if (keyInfo.enumValues && keyInfo.enumValues.length > 0) {
    doc += `\n\n**Valid values:** ${keyInfo.enumValues.join(', ')}`;
  }
  
  if (keyInfo.examples && keyInfo.examples.length > 0) {
    doc += `\n\n**Examples:**\n${keyInfo.examples.map((ex: string) => `- \`${ex}\``).join('\n')}`;
  }
  
  if (keyInfo.platforms && keyInfo.platforms.length > 0) {
    doc += `\n\n**Platforms:** ${keyInfo.platforms.join(', ')}`;
  }
  
  if (keyInfo.deprecated) {
    doc += `\n\n⚠️ **Deprecated**`;
  }
  
  return doc;
}