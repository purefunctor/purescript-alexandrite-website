import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

const { default: { Compiler } } = await import(pathToFileURL(path.resolve(process.argv[2])).href);
const file = (path, source) => ({path, source});
function checkGraph(outputs) {
  const names = new Set(outputs.map(o => o.path));
  for (const output of outputs) {
    const module = new vm.SourceTextModule(output.source);
    for (const specifier of module.dependencySpecifiers) {
      if (specifier.startsWith('.')) {
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(output.path), specifier));
        assert(names.has(target), `${output.path} imports missing ${target}`);
      }
    }
  }
}
const compiler = new Compiler();
for (const [name, value, ok] of [['Main', '1', true], ['Renamed', 'missing', false], ['Renamed', '2', true], ['Main', '', false], ['Main', '3', true]]) {
  const result = compiler.compile([file('Main.purs', `module ${name} where\nvalue :: Int\nvalue = ${value}`)]);
  assert.equal(result.outputs.length > 0, ok, JSON.stringify(result));
  if (ok) assert(result.outputs.some(o => o.path === `${name}/index.js` && o.source.includes(value)));
  else assert(result.diagnostics.some(d => d.severity === 'error'));
}
for (const sources of [
  [file('Main.purs', 'module Main where\nimport Missing\nx = 1')],
  [file('Main.purs', 'module Main where\nx :: String\nx = 1')],
  [file('A.purs', 'module A where\nimport B\nx = 1'), file('B.purs', 'module B where\nimport A\ny = 1')],
]) {
  const result = compiler.compile(sources);
  assert.equal(result.outputs.length, 0, JSON.stringify(result));
  assert(result.diagnostics.some(d => d.severity === 'error'));
}
// Exercise recovery on the SAME WASM class instance after cyclic queries.
assert(compiler.compile([file('Main.purs', 'module Main where\nx = 4')]).outputs.length);
const unicode = 'module Main where\n-- 🌈 café\nvalue :: Int\nvalue = missing';
const unicodeResult = compiler.compile([file('Main.purs', unicode)]);
const missing = unicodeResult.diagnostics.find(d => d.message.includes('not in scope'));
assert.equal(missing.start, Buffer.byteLength(unicode.slice(0, unicode.indexOf('missing'))));
assert.equal(missing.end - missing.start, 7);
const multiple = compiler.compile([
  file('Main.purs', 'module Main where\nimport Other (value)\nanswer :: Int\nanswer = value'),
  file('Other.purs', 'module Other where\nvalue :: Int\nvalue = 42'),
]);
assert(!multiple.diagnostics.some(d => d.severity === 'error'), JSON.stringify(multiple.diagnostics));
assert(multiple.outputs.some(o => o.path === 'Other/index.js'));
const packages = [];
function collect(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const name = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(name);
    else if (/\.(purs|js)$/.test(name)) packages.push(file(name, fs.readFileSync(name, 'utf8')));
  }
}
collect(process.argv[3]);
compiler.setPackages(packages);
const main = file('Main.purs', 'module Main where\nimport Prelude\nanswer :: Int\nanswer = 20 + 22');
const result = compiler.compile([main]);
assert(!result.diagnostics.some(d => d.severity === 'error'), JSON.stringify(result.diagnostics));
assert(result.outputs.some(o => o.path === 'Main/index.js' && o.source.includes('answer')));
assert(result.outputs.some(o => o.path.endsWith('/foreign.js')));
// Syntax-check and validate internal graph completeness without evaluating modules.
assert.equal(result.outputs[0].path, 'Main/index.js');
checkGraph(result.outputs);
compiler.setPackages([]);
assert.equal(compiler.compile([main]).outputs.length, 0);
const initialized = new Compiler(packages);
assert(initialized.compile([main]).outputs.length);
initialized.free();
const foreign = file('Main.purs', 'module Main where\nforeign import value :: Int');
assert.equal(compiler.compile([foreign]).outputs.length, 0);
assert(compiler.compile([foreign, file('Main.js', 'export const value = 42;')]).outputs.some(o => o.path === 'Main/foreign.js'));
for (const source of ['export const other = 1;', 'export const value = ;']) {
  assert.equal(compiler.compile([foreign, file('Main.js', source)]).outputs.length, 0);
}
assert.throws(() => compiler.compile('not a file map'));
if (process.env.PLAYGROUND_PACKAGES) {
  const bundle = JSON.parse(fs.readFileSync(process.env.PLAYGROUND_PACKAGES, 'utf8'));
  compiler.setPackages(bundle.files);
  const source = 'module Main where\nimport Prelude\nimport React.Basic as React\nimport React.Basic.Hooks as Hooks\nimport Halogen as H\nanswer :: Int\nanswer = 20 + 22\nreact = React.empty\nhooks = Hooks.useState 0\nhalogen = H.mkComponent';
  const full = compiler.compile([file('Main.purs', source)]);
  assert(!full.diagnostics.some(d => d.severity === 'error'), JSON.stringify(full.diagnostics));
  assert.equal(full.outputs[0].path, 'Main/index.js');
  assert(full.outputs.some(o => o.path === 'React.Basic.Hooks/index.js'));
  assert(full.outputs.some(o => o.path.startsWith('Halogen.')));
  checkGraph(full.outputs);
  const defaultMain = compiler.compile([file('Main.purs', 'module Main where\nimport Prelude\nimport Effect (Effect)\nimport Effect.Console (log)\nmain :: Effect Unit\nmain = log "Hello from Alexandrite!"')]);
  assert(!defaultMain.diagnostics.some(d => d.severity === 'error'), JSON.stringify(defaultMain.diagnostics));
  const generatedMain = defaultMain.outputs.find(o => o.path === 'Main/index.js');
  assert(generatedMain && /export\s+(const|function)\s+main\b/.test(generatedMain.source), generatedMain?.source);
  checkGraph(defaultMain.outputs); // Compile preview only; do not call main.
  assert(defaultMain.outputs.some(o => o.path === 'Effect.Console/foreign.js'));
  console.log(`Full package integration passed: ${bundle.packages.length} packages, ${bundle.files.length} inputs, ${full.outputs.length} syntax-checked outputs`);
}
compiler.free();
console.log(`WASM tests passed: real Prelude (${packages.length} inputs, ${result.outputs.length} outputs), JS syntax, FFI, diagnostics, package replacement, rename, repeated edits and cycle recovery`);
