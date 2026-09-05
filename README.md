# Alexandrite website

The Alexandrite website uses Astro for routing and server rendering on Cloudflare Workers. Its React components are implemented in PureScript and compiled with Alexandrite.

Use Node.js 22 and pnpm 12.3.4 (pinned in `package.json`). To install the pinned package manager and dependencies:

```sh
npm install --global pnpm@12.3.4
pnpm install --frozen-lockfile
```

```sh
pnpm dev      # Watch PureScript and run Astro locally
pnpm build    # Compile PureScript and build the Cloudflare Worker
pnpm preview  # Run the production build in workerd
pnpm deploy   # Build and deploy with Wrangler
```

Astro server-renders routes by default. Add `export const prerender = true` to an Astro page when it can be generated as a static asset instead.

## Playground

The UI, React hooks and StyleX declarations are authored in
`src/Playground/Index.purs` and `src/Playground/Result.purs`. Their JavaScript FFI
companions implement browser effects: Monaco and compiler workers, focus,
runtime loading and sandbox messaging. PureScript hooks own state and cleanup.

`/playground` edits one PureScript module in Monaco. Edits compile automatically after 500 ms without changes, in a WASM worker. Successful output automatically imports the generated entry module and calls `main()` inside the Result frame. No `Effect Unit` signature is enforced; `main` only needs to be callable. DOM applications should mount into the frame's `#root`. JavaScript and Result tabs preserve the running program; editing or stopping destroys its frame.

The example selector replaces the current source and resets the result. Examples include console output, a React Hooks counter with inline styles, and array transformations. The counter supplies a small `Main.js` FFI bridge for DOM elements and mounting; its editable PureScript contains the state and styling. Browser-side StyleX compilation is not included.

The adapter lives in this repository under `playground/compiler`. Its build references a local compiler checkout without modifying it:

```sh
export ALEXANDRITE_REPOSITORY=/path/to/purescript-alexandrite
# Default: ../repos/purescript-alexandrite
rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli --version 0.2.127 --locked
pnpm build:playground
```

Both `pnpm dev` and `pnpm build` build the package sources, npm runtime and WASM bindings first. WASM always uses Cargo's release profile, including in development: size optimization, LTO and one codegen unit. Generated files in `public/playground/` and `build/` are ignored.

In an orb, `.agents/setup` installs Node.js 22, pnpm and the compiler tools, then builds the production website and release WASM with two Cargo jobs by default. `.amp/with-alexandrite` supplies the native compiler. After activation or resume, `.agents/resume` starts the managed `website` production preview and registers its portal. Service startup does not run compiler watchers or rebuild WASM. To refresh the preview after source changes:

```sh
amp orb service stop website
.amp/with-alexandrite pnpm build
amp orb service restart website
```

The playground locks Registry set **80.8.1**, independently of the website's own Spago dependencies: 59 PureScript-organization roots plus React Basic, React Basic Hooks and Halogen, with 85 packages in the dependency closure. Builds verify archive hashes and use a local cache; they do not silently upgrade the lock. See [package maintenance](playground/packages/CONTRACT.md) for updating it. React and React DOM 19 are bundled separately for the result runtime; the website itself remains on React 18. Other bare npm imports are rejected rather than fetched at runtime.

The compiler accepts arrays of `{path, source}` files, so multi-file editing can be added without changing its API. See [adapter API](playground/compiler/API.md).

### Checks

```sh
pnpm test:playground
node scripts/build-playground-wasm.mjs --test-native
PLAYGROUND_PACKAGES="$PWD/public/playground/packages.json" node scripts/build-playground-wasm.mjs --test-wasm
# Requires installed agent-browser and a running dev/preview server:
node scripts/test-playground-browser.mjs http://localhost:4321/playground
```

### Execution boundary

Generated JavaScript never executes in the host page. Each run uses an opaque-origin iframe with only `allow-scripts`; its CSP blocks fetch/XHR, external subresources, workers, nested frames and form submission. Console values are displayed as text, and parent messages are checked against the frame, origin and run ID. Production headers also sandbox the standalone frame document. Module sources arrive as data and become blob modules inside that frame.

This is **not a hard CPU or memory sandbox**: a synchronous infinite loop may freeze the browser renderer, and the execution timeout cannot preempt it. The absence of accounts does not remove XSS risk. Before adding network access, persistence, sharing or arbitrary npm dependencies, revisit the isolation policy; hostile public execution warrants a separate origin and stronger resource isolation.
