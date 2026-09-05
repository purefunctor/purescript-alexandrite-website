# Website compiler adapter

This directory owns an independent single-threaded query engine using Alexandrite's
frontend and functional/JavaScript backends. It never runs generated JavaScript.

```js
import init, { Compiler } from './playground_compiler.js';
await init();
const compiler = new Compiler(packages); // optional array of { path, source }
compiler.setPackages(packages); // replaces the entire package source set
const result = compiler.compile([{path: 'Main.purs', source: 'module Main where\nx = 1'}]);
compiler.free();
```

`compile` is synchronous: call it in a Worker, not on the UI thread. The return is
`{outputs: [{path, source}], diagnostics: [{path, message, severity, start?, end?}]}`.
Severity is `error` or `warning`. Spans are half-open **UTF-8 byte offsets** in the
identified source file (parse errors have zero-width spans), not UTF-16 indices.
Errors without a reliable span omit both offsets. Invalid API argument shapes throw;
source errors return diagnostics. All errors suppress all outputs; each call uses a
fresh engine, so module renames, package replacement and errors cannot retain output.

Inputs support `.purs` and `.js` text. Match FFI by adjacent basename (`X.purs` →
`X.js`); paths must be unique across package and editable files. Duplicate and Prim
module names are rejected. All supplied PureScript modules are checked, including
packages, so callers should supply a coherent package closure. Outputs contain only
the editable modules and their transitive backend dependencies: `<Module.Name>/index.js`,
required `foreign.js` text and `runtime.js` when needed. The first output is the first
editable PureScript module's JavaScript, even if its declaration is renamed. Normal
relative import specifiers are preserved; external bare npm imports in FFI must be
provided by the separate runtime. Unused source imports may be pruned by the backend.
No package fetching, filesystem access, evaluation or execution occurs in WASM.
The compile preview neither requires an exported `main` nor validates its signature.
Future execution may import the generated module and call its exported `main()`;
that runtime behavior is deliberately outside this adapter.

Build prerequisites: current Rust toolchain, `rustup target add wasm32-unknown-unknown`,
and `cargo install wasm-bindgen-cli --version 0.2.127 --locked`.

```sh
node scripts/build-playground-wasm.mjs --test-native
node scripts/build-playground-wasm.mjs --test-wasm
node scripts/build-playground-wasm.mjs
# Additionally validate the complete website package bundle and Effect.Console main:
PLAYGROUND_PACKAGES="$PWD/public/playground/packages.json" node scripts/build-playground-wasm.mjs --test-wasm
```

`ALEXANDRITE_REPOSITORY` selects the compiler checkout (default
`../repos/purescript-alexandrite`, relative to the website root). The script generates
a Cargo workspace and resolved path dependencies in ignored `build/playground-compiler/`;
it does not modify the compiler checkout. Web bindings and WASM are emitted under
`build/playground-compiler/pkg-web/` and copied to `public/playground/wasm/` (the
integrating website must ignore that generated directory). The entry point is
`/playground/wasm/playground_compiler.js`, with sibling `playground_compiler_bg.wasm`.
The WASM test uses `pkg-nodejs/` instead. Test modes download a checksum-pinned
Registry Prelude 6.0.2 fixture once into the ignored build workspace. The optional
`PLAYGROUND_PACKAGES` check reads an already-built package bundle; it does not build it.

The adapter is intentionally stricter than Alexandrite's editor recovery for missing
expressions and its opaque-FFI fallback: incomplete expressions and JavaScript parse
errors are errors here and suppress all output. Normal compiler warnings remain warnings.
