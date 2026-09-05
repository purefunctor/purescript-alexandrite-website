# Alexandrite website

The website for [Alexandrite](https://github.com/purefunctor/purescript-alexandrite), a PureScript compiler. Built with Astro, React and PureScript.

## Quickstart

### Prerequisites

You'll need Node.js 22, pnpm 12.3.4, a current stable Rust toolchain, the `wasm32-unknown-unknown` target, and `wasm-bindgen-cli` 0.2.127. See the playground's [toolchain instructions](playground/compiler/API.md#building) for the Rust commands. Install pnpm with `npm install --global pnpm@12.3.4`.

You'll also need a checkout of [the Alexandrite compiler](https://github.com/purefunctor/purescript-alexandrite) at `../repos/purescript-alexandrite`, or set `ALEXANDRITE_REPOSITORY` to its path. The commands below build the native compiler from that checkout; no separate Alexandrite installation is needed.

**In an Amp orb:** the setup script installs only developer tools. Once the orb is ready, install dependencies and build as shown below. The compiler is available as an additional checkout. The development server does not start automatically; ask your agent to start it when you need it.

### First time

Run these from the website directory:

```sh
pnpm install --frozen-lockfile
.amp/with-alexandrite pnpm build
```

The build prepares the native compiler, browser compiler (WASM), playground assets, and production website. The first build can take a while; later builds reuse caches.

### Start developing

On your machine, run:

```sh
.amp/with-alexandrite pnpm dev
```

This prepares the playground and PureScript output, then starts the compiler watcher and Astro with live updates. You don't need to repeat dependency installation unless dependencies change. For agent-specific orb startup commands, see [the agent guide](AGENTS.md#orb-setup-and-preview).

Run `.amp/with-alexandrite pnpm build` again for a production build, then `pnpm preview` to try it locally.

## Playground

Open `/playground` to edit and run PureScript in your browser. Start with an example, change the code, and see the generated JavaScript and running result.

<a id="execution-boundary"></a>

Programs run in a sandboxed frame without network access. The compiler worker downloads the pinned PureScript package archives directly from the Registry, verifies their SHA-256 hashes, and caches them in the browser. Package sources are not included in the website build. The compiler and JavaScript runtime are still bundled website assets.

The header shows package-loading progress. The Packages sidebar links to version-specific Pursuit documentation and displays the license and notice files included in each downloaded archive. Archives without those files link to the upstream repository instead.

Repeat visits reuse verified cached archives. Browser storage can be disabled or evicted; a first visit or a cache miss requires Registry access. This is not a fully offline application. Infinite loops can still freeze the browser tab.
