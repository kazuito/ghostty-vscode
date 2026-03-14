import { describe, expect, it } from "vitest";
import {
  additiveKeys,
  commaKeys,
  extractSchemaValues,
  optionByKey,
  validKeys,
} from "../lib/schema";

describe("schema indexes", () => {
  it("exposes fast key lookups", () => {
    expect(validKeys.has("font-size")).toBe(true);
    expect(optionByKey.get("font-size")?.key).toBe("font-size");
  });

  it("preserves additive and comma-separated key metadata", () => {
    expect(additiveKeys.has("keybind")).toBe(true);
    expect(commaKeys.has("app-notifications")).toBe(true);
  });
});

describe("extractSchemaValues", () => {
  it("extracts boolean values", () => {
    const values = extractSchemaValues(optionByKey.get("font-thicken")!.schema);
    expect(values).toEqual(["true", "false"]);
  });

  it("extracts enum values", () => {
    const values = extractSchemaValues(
      optionByKey.get("alpha-blending")!.schema,
    );
    expect(values).toContain("native");
    expect(values).toContain("linear");
  });

  it("extracts union literal values", () => {
    const values = extractSchemaValues(
      optionByKey.get("window-subtitle")!.schema,
    );
    expect(values).toContain("false");
    expect(values).toContain("working-directory");
  });

  it("returns null for non-enum-like schemas", () => {
    expect(
      extractSchemaValues(optionByKey.get("font-size")!.schema),
    ).toBeNull();
  });
});
