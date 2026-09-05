# Alexandrite website

The website for [Alexandrite](https://github.com/purefunctor/purescript-alexandrite), a PureScript compiler. Built with Astro, React and PureScript.

## Running locally

You'll need Node.js 22 and Alexandrite installed. The playground also requires Rust and a compiler checkout; follow its [build instructions](playground/compiler/API.md#building) first.

```sh
npm install --global pnpm@12.3.4
pnpm install --frozen-lockfile
pnpm dev
```

Use `pnpm build` to create a production build and `pnpm preview` to try it locally.

## Playground

Open `/playground` to edit and run PureScript in your browser. Start with an example, change the code, and see the generated JavaScript and running result.

<a id="execution-boundary"></a>

Programs run in a sandboxed frame without network access. The compiler worker downloads the pinned PureScript package archives directly from the Registry, verifies their SHA-256 hashes, and caches them in the browser. Package sources are not included in the website build. The compiler and JavaScript runtime are still bundled website assets.

The header shows package-loading progress. The Packages sidebar links to version-specific Pursuit documentation and displays the license and notice files included in each downloaded archive. Archives without those files link to the upstream repository instead.

Repeat visits reuse verified cached archives. Browser storage can be disabled or evicted; a first visit or a cache miss requires Registry access. This is not a fully offline application. Infinite loops can still freeze the browser tab.
