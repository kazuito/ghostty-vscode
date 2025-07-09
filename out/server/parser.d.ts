import { ParsedConfig } from '../shared/types';
export declare class GhosttyConfigParser {
    private content;
    private lines;
    private currentLine;
    constructor(content: string);
    parse(): ParsedConfig;
    private parseValue;
    private parseBooleanValue;
    private parseNumberValue;
    private parseColorValue;
    private parseEnumValue;
    private parseKeybindValue;
    private parseKeybind;
    private parseKeybindSequence;
    private parseKeybindTrigger;
    private parseKeybindAction;
    private parseThemeValue;
    private parsePathValue;
    private parsePercentageValue;
}
export declare function parseGhosttyConfig(content: string): ParsedConfig;
//# sourceMappingURL=parser.d.ts.map