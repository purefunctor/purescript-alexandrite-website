import { mkdir, writeFile, cp, realpath, access, readFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const compiler = await realpath(resolve(root, process.env.ALEXANDRITE_REPOSITORY || '../repos/purescript-alexandrite'));
const build = join(root, 'build/playground-compiler');
const run = (command, args) => {
  const child = spawnSync(command, args, { cwd: build, stdio: 'inherit' });
  if (child.error) throw child.error;
  if (child.status !== 0) throw new Error(`${command} exited ${child.status}`);
};
const groups = {
  'compiler-core': ['building-types', 'files', 'prim-constants'],
  'compiler-frontend': ['checking', 'diagnostics', 'documenting', 'indexing', 'lexing', 'lowering', 'parsing', 'resolving', 'stabilizing', 'sugar'],
  'compiler-backend': ['functional', 'javascript', 'foreign-javascript'],
};
await mkdir(build, { recursive: true });
let dependencies = '';
for (const [group, names] of Object.entries(groups)) {
  for (const name of names) {
    const path = join(compiler, group, name);
    await access(join(path, 'Cargo.toml'));
    dependencies += `${name} = { path = ${JSON.stringify(path)} }\n`;
  }
}
await writeFile(join(build, 'Cargo.toml'), `[workspace]
[package]
name = "playground-compiler"
version = "0.1.0"
edition = "2024"
[lib]
crate-type = ["cdylib", "rlib"]
[dependencies]
${dependencies}
wasm-bindgen = "=0.2.127"
console_error_panic_hook = "0.1.7"
serde = { version = "1", features = ["derive"] }
serde-wasm-bindgen = "0.6"
rustc-hash = "2"
smol_str = "0.3.6"
[profile.release]
opt-level = "s"
lto = true
codegen-units = 1
`);
// Cargo checks source mtimes: copying unchanged files must not trigger release LTO again.
await cp(join(root, 'playground/compiler/src'), join(build, 'src'), { recursive: true, preserveTimestamps: true });
await cp(join(root, 'playground/compiler/tests'), join(build, 'tests'), { recursive: true, preserveTimestamps: true });
// Real Registry Prelude, including its FFI, is a test fixture only. Pin its bytes.
if (process.argv.includes('--test-native') || process.argv.includes('--test-wasm')) {
  const archive = join(build, 'prelude-6.0.2.tar.gz');
  let bytes;
  try { bytes = await readFile(archive); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const response = await fetch('https://packages.registry.purescript.org/prelude/6.0.2.tar.gz');
    if (!response.ok) throw new Error(`Prelude fixture download: ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  if (createHash('sha256').update(bytes).digest('hex') !== '22aca4ac346ab86503fcb45269def2ef9859bf76d4b0643892773cb5d7b3f10c') {
    throw new Error('Prelude fixture checksum mismatch');
  }
  await writeFile(archive, bytes);
  run('tar', ['-xzf', archive]);
}
if (process.argv.includes('--test-native')) {
  run('cargo', ['test']);
} else {
  run('cargo', ['build', '--release', '--target', 'wasm32-unknown-unknown']);
  const target = process.argv.includes('--test-wasm') ? 'nodejs' : 'web';
  run('wasm-bindgen', ['--target', target, '--out-dir', `pkg-${target}`, '--out-name', 'playground_compiler', 'target/wasm32-unknown-unknown/release/playground_compiler.wasm']);
  if (target === 'nodejs') {
    await writeFile(join(build, 'pkg-nodejs/package.json'), '{"type":"commonjs"}\n');
    run('node', ['--experimental-vm-modules', join(root, 'playground/compiler/tests/wasm.mjs'), join(build, 'pkg-nodejs/playground_compiler.js'), join(build, 'prelude-6.0.2/src')]);
  } else {
    await cp(join(build, 'pkg-web'), join(root, 'public/playground/wasm'), { recursive: true });
  }
  console.log(`Playground WASM: ${join(build, `pkg-${target}`)}`);
}
