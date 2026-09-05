# Alexandrite website

The website for [Alexandrite](https://github.com/purefunctor/purescript-alexandrite), a PureScript compiler. Built with Astro, React and PureScript.

## Quickstart

### Prerequisites

You'll need Node.js 22, pnpm 12.3.4, a current stable Rust toolchain, the `wasm32-unknown-unknown` target, and `wasm-bindgen-cli` 0.2.127. See the playground's [toolchain instructions](playground/compiler/API.md#building) for the Rust commands. Install pnpm with `npm install --global pnpm@12.3.4`.

You'll also need a checkout of [the Alexandrite compiler](https://github.com/purefunctor/purescript-alexandrite) at `../repos/purescript-alexandrite`, or set `ALEXANDRITE_REPOSITORY` to its path. The commands below build the native compiler from that checkout; no separate Alexandrite installation is needed.

**In an Amp orb:** open Website or Playground in the Portal tab. Orb preparation installs the tools and dependencies and builds the development assets; startup reuses those caches and starts the dev server. A fresh preparation takes longer than starting from a cached snapshot. See [the agent guide](AGENTS.md#orb-setup-and-preview) for lifecycle and recovery commands.

### First time

On your machine, run these from the website directory:

```sh
pnpm install --frozen-lockfile
.amp/with-alexandrite pnpm dev
```

This builds the native compiler, browser compiler (WASM), and website components, then starts the dev server. The first build can take a while; later starts reuse caches. A production build is not required for development.

### Start developing

On your machine, run:

```sh
.amp/with-alexandrite pnpm dev
```

This prepares the playground and PureScript output, then starts the compiler watcher and Astro with live updates. You don't need to repeat dependency installation unless dependencies change. For agent-specific orb startup commands, see [the agent guide](AGENTS.md#orb-setup-and-preview).

Development uses Astro's Node server for fast startup. Run `.amp/with-alexandrite pnpm build` for a production build, then `pnpm preview` to test it in Cloudflare's Worker runtime before deploying.

## Playground

Open `/playground` to edit and run PureScript in your browser. Start with an example, change the code, and see the generated JavaScript and running result.

<a id="execution-boundary"></a>

Programs run in a sandboxed frame without network access. The compiler worker downloads the pinned PureScript package archives directly from the Registry, verifies their SHA-256 hashes, and caches them in the browser. Package sources are not included in the website build. The compiler and JavaScript runtime are still bundled website assets.

The header shows package-loading progress. The Packages sidebar links to version-specific Pursuit documentation and displays the license and notice files included in each downloaded archive. Archives without those files link to the upstream repository instead.

Repeat visits reuse verified cached archives. Browser storage can be disabled or evicted; a first visit or a cache miss requires Registry access. This is not a fully offline application. Infinite loops can still freeze the browser tab.
