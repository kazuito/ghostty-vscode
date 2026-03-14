import { defineConfig } from "rolldown";

export default defineConfig([
  {
    input: "src/client/extension.ts",
    external: ["vscode"],
    platform: "node",
    output: {
      file: "out/client/extension.js",
      format: "cjs",
      sourcemap: true,
    },
  },
  {
    input: "src/server/server.ts",
    platform: "node",
    output: {
      file: "out/server/server.js",
      format: "cjs",
      sourcemap: true,
    },
  },
]);
