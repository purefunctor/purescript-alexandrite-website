import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const compiler = resolve(process.env.ALEXANDRITE_REPOSITORY || "../repos/purescript-alexandrite");
const stamp = "build/dev-prepared.json";
const hash = createHash("sha256");
const run = (command, args, cwd = process.cwd()) => execFileSync(command, args, {
  cwd, encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
});
for (const directory of [process.cwd(), compiler]) {
  // Include local edits and new files, not just HEAD. Generated files are
  // gitignored; they are validated separately before reusing a completed build.
  hash.update(directory);
  hash.update(run("git", ["rev-parse", "HEAD"], directory));
  hash.update(run("git", ["diff", "--no-ext-diff", "--no-textconv", "--binary", "HEAD"], directory));
  for (const file of run("git", ["ls-files", "--others", "--exclude-standard", "-z"], directory).split("\0").filter(Boolean).sort()) {
    const bytes = readFileSync(resolve(directory, file));
    hash.update(`${file}\0${bytes.length}\0`).update(bytes);
  }
}
hash.update(process.version);
hash.update(run("rustc", ["--version"]));
hash.update(run("wasm-bindgen", ["--version"]));
hash.update(process.env.RUSTFLAGS || "");
hash.update(process.env.CARGO_ENCODED_RUSTFLAGS || "");
const key = hash.digest("hex");
let previous;
try {
  previous = JSON.parse(readFileSync(stamp, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
}
if (previous?.key === key && previous.outputs.every(file => existsSync(file))) {
  console.log("Development inputs unchanged; reusing prepared compiler, WASM and PureScript.");
} else {
  // A failed or interrupted rebuild must never leave a reusable success stamp.
  rmSync(stamp, { force: true });
  const result = spawnSync(".amp/with-alexandrite", [
    "pnpm", "exec", "concurrently", "--kill-others-on-fail", "--names", "playground,purescript",
    "pnpm build:playground", "pnpm build:purescript",
  ], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  const assets = JSON.parse(readFileSync("build/playground-assets.json", "utf8"));
  const outputs = [
    resolve(compiler, "target/release/purescript-alexandrite"),
    "build/playground-assets.json",
    "build/playground-runtime/runtime.json",
    "build/playground-compiler/pkg-web/playground_compiler.js",
    "build/playground-compiler/pkg-web/playground_compiler_bg.wasm",
    `public${assets.compiler}`,
    `public${assets.compiler.replace(/[^/]+$/, "playground_compiler_bg.wasm")}`,
    `public${assets.runtime}`,
    ...readdirSync("output", { recursive: true }).filter(file => file.endsWith(".js")).map(file => `output/${file}`),
  ];
  const missing = outputs.filter(file => !existsSync(file));
  if (missing.length) throw new Error(`Development preparation left missing outputs: ${missing.join(", ")}`);
  writeFileSync(stamp, JSON.stringify({ key, outputs }));
}
