import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

// Content-address both the bindings and WASM together: bindings resolve WASM as a sibling.
const compilerFiles = ["playground_compiler.js", "playground_compiler_bg.wasm"];
const compiler = await Promise.all(compilerFiles.map(name => readFile(`build/playground-compiler/pkg-web/${name}`)));
const runtime = await readFile("build/playground-runtime/runtime.json");
const hash = files => {
  const digest = createHash("sha256");
  for (const bytes of files) digest.update(bytes);
  return digest.digest("hex");
};
const compilerPath = `/playground/assets/${hash(compiler)}`;
const runtimePath = `/playground/assets/${hash([runtime])}`;
await mkdir(`public${compilerPath}`, { recursive: true });
await mkdir(`public${runtimePath}`, { recursive: true });
await Promise.all(compilerFiles.map((name, index) => writeFile(`public${compilerPath}/${name}`, compiler[index])));
await writeFile(`public${runtimePath}/runtime.json`, runtime);
await writeFile("build/playground-assets.json", JSON.stringify({
  compiler: `${compilerPath}/playground_compiler.js`,
  runtime: `${runtimePath}/runtime.json`,
}));
// Remove legacy unversioned artifacts, not older content-addressed releases.
await rm("public/playground/wasm", { recursive: true, force: true });
await rm("public/playground/runtime.json", { force: true });
console.log("Published content-addressed compiler and runtime assets.");
