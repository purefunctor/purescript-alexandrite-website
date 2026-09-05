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

Programs run in a sandboxed frame without network access. Packages are bundled rather than installed on demand. Infinite loops can still freeze the browser tab.
