import type { configKeys } from "@/generated/config-keys";

export type GhosttyConfigKey = (typeof configKeys)[number]["key"];

export type ConfigEntry = {
  key: string;
  desc: string;
  enum?: Array<string | number | boolean>;
  assets?: Array<"color" | "font">;
  comma?: boolean;
};

export type ConfigMetadata = Omit<ConfigEntry, "key" | "desc"> & {
  desc?: string;
};
