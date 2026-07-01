export { createValidationTempPath, runGhosttyValidation } from "./cli";
export { validateInProcess } from "./inProcess";
export { buildUnparsedErrorsDiagnostic, parseGhosttyOutput } from "./parse";
export {
  DUPLICATE_KEY_MESSAGE_PREFIX,
  UNKNOWN_FIELD_MESSAGE,
} from "./types";
export type {
  DiagnosticSeverity,
  ValidationDiagnostic,
  ValidationResult,
} from "./types";
