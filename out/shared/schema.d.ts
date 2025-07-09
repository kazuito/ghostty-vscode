import { GhosttyConfigKey } from './types';
export declare const GHOSTTY_CONFIG_SCHEMA: GhosttyConfigKey[];
export declare const GHOSTTY_CONFIG_MAP: Map<string, GhosttyConfigKey>;
export declare function getConfigKeyInfo(key: string): GhosttyConfigKey | undefined;
export declare function getAllConfigKeys(): string[];
export declare function getConfigKeysByType(type: string): GhosttyConfigKey[];
export declare function getConfigKeysByPlatform(platform: 'macos' | 'linux' | 'windows'): GhosttyConfigKey[];
//# sourceMappingURL=schema.d.ts.map