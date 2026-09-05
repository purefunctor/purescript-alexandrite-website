import { dev } from "astro";

// A finite preparation task: exercise the real dev pipeline, then close it.
// No server, portal, authentication, or browser storage enters the snapshot.
const started = performance.now();
const server = await dev({ server: { host: "127.0.0.1", port: 0, open: false }, logLevel: "warn" });
try {
  const base = `http://127.0.0.1:${server.address.port}`;
  for (const path of [
    "/",
    "/playground",
    "/output/Website.Landing.Index/index.js",
    "/output/Website.Playground.Index/index.js",
    "/src/Website/Playground/editor.js",
    "/node_modules/.vite-dev/deps/react.js",
  ]) {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`Dev warmup ${path}: HTTP ${response.status}`);
    await response.arrayBuffer();
  }
} finally {
  await server.stop();
}
console.log(`Dev caches ready in ${((performance.now() - started) / 1000).toFixed(2)}s; temporary server closed.`);
