import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

// A finite, self-contained browser fixture: no production route or dev server needed.
const bundle = await build({
  entryPoints: [fileURLToPath(new URL("./fixtures/dialog-animations.js", import.meta.url))],
  bundle: true, write: false, format: "esm", platform: "browser",
  // Exercise StrictMode's real effect cleanup/replay as well as explicit root.unmount().
  define: { "process.env.NODE_ENV": '"development"' },
});
const server = createServer((request, response) => {
  response.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'");
  if (request.url === "/test.js") {
    response.setHeader("Content-Type", "text/javascript");
    response.end(bundle.outputFiles[0].contents);
  } else {
    response.setHeader("Content-Type", "text/html");
    response.end('<!doctype html><style>dialog{width:300px}dialog::backdrop{background:#0008;opacity:1}</style><button id="opener">Open</button><script type="module" src="/test.js"></script>');
  }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const session = `dialog-test-${process.pid}`;
const exec = promisify(execFile);
const browser = async (...args) => (await exec("agent-browser", ["--session", session, ...args])).stdout;
try {
  for (const reduced of [false, true]) {
    if (reduced) await browser("set", "media", "reduced-motion");
    await browser("open", `http://127.0.0.1:${server.address().port}`);
    await browser("wait", "--fn", "!!window.testResult");
    const result = JSON.parse(await browser("eval", "window.testResult"));
    assert.equal(result.error, undefined, result.error);
    assert.equal(result.reduced, reduced);
    assert.equal(result.checks, reduced ? 2 : 14);
  }
  console.log("Dialog animation browser checks passed: both profiles, numeric reversals, stale completion, React unmount/replay, owned cancellation, style restoration, focus and reduced motion.");
} finally {
  await browser("close");
  await new Promise(resolve => server.close(resolve));
}
