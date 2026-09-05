import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { relative, resolve } from "node:path";

const require = createRequire(new URL("../playground/runtime/package.json", import.meta.url));
const output = resolve("build/playground-runtime");
const result = await build({
  entryPoints: {
    react: require.resolve("react"),
    "react-dom": require.resolve("react-dom"),
    "react-dom-client": require.resolve("react-dom/client"),
  },
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  define: { "process.env.NODE_ENV": '"production"' },
  minify: true,
  legalComments: "inline",
  write: false,
  outdir: resolve(output, "npm"),
});
await mkdir(output, { recursive: true });
await writeFile(
  resolve(output, "runtime.json"),
  JSON.stringify({
    imports: {
      react: "npm/react.js",
      "react-dom": "npm/react-dom.js",
      "react-dom/client": "npm/react-dom-client.js",
    },
    files: result.outputFiles.map((file) => ({
      path: relative(output, file.path).replaceAll("\\", "/"),
      source: file.text,
    })),
  }),
);
console.log(`Bundled React runtime into ${output}/runtime.json`);
