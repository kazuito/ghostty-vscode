import { defineConfig } from "rolldown";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig([
  {
    input: "src/client/extension.ts",
    external: ["vscode"],
    platform: "node",
    ...(isProd && { treeshake: true }),
    output: {
      file: "out/client/extension.js",
      format: "cjs",
      sourcemap: !isProd,
      ...(isProd && { minify: true }),
    },
  },
  {
    input: "src/server/server.ts",
    platform: "node",
    ...(isProd && { treeshake: true }),
    output: {
      file: "out/server/server.js",
      format: "cjs",
      sourcemap: !isProd,
      ...(isProd && { minify: true }),
    },
  },
]);
