import { defineConfig } from "rolldown";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig([
  {
    input: "src/client/index.ts",
    external: ["vscode"],
    platform: "node",
    ...(isProd && { treeshake: true }),
    output: {
      file: "out/client/index.js",
      format: "cjs",
      sourcemap: !isProd,
      ...(isProd && { minify: true }),
    },
  },
  {
    input: "src/server/index.ts",
    platform: "node",
    ...(isProd && { treeshake: true }),
    output: {
      file: "out/server/index.js",
      format: "cjs",
      sourcemap: !isProd,
      ...(isProd && { minify: true }),
    },
  },
]);
