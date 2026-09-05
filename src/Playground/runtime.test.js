import assert from "node:assert/strict";
import { test } from "node:test";
import { prepareExecution } from "./runtime.js";

test("links relative imports, re-exports and npm imports without touching string contents", async () => {
  const output = await prepareExecution(
    [
      {
        path: "Main/index.js",
        source: `import { x } from '../Other/index.js'; export { x } from '../Other/index.js'; const text = "import '../Other/index.js'"; export const main = () => x;`,
      },
      {
        path: "Other/index.js",
        source: `import React from 'react'; export const x = React;`,
      },
    ],
    {
      files: [{ path: "npm/react.js", source: "export default {};" }],
      imports: { react: "npm/react.js" },
    },
  );
  assert.equal(output.entry, "playground/Main/index.js");
  assert.match(output.files[0].source, /from "playground\/Other\/index.js"/);
  assert.match(
    output.files[0].source,
    /const text = "import '..\/Other\/index.js'"/,
  );
  assert.match(output.files[1].source, /from "playground\/npm\/react.js"/);
});

test("rejects unbundled and computed imports instead of fetching or evaluating them", async () => {
  for (const source of [
    `import 'https://example.com/code.js'`,
    `import(name)`,
  ]) {
    await assert.rejects(
      prepareExecution([{ path: "Main/index.js", source }], {
        files: [],
        imports: {},
      }),
      /not bundled|not supported/,
    );
  }
});

test("links literal dynamic imports and permits import.meta", async () => {
  const result = await prepareExecution(
    [
      {
        path: "Main/index.js",
        source: `const x = import('./dep.js'); const url = import.meta.url;`,
      },
      { path: "Main/dep.js", source: "export const value = 1;" },
    ],
    { files: [], imports: {} },
  );
  assert.match(result.files[0].source, /import\("playground\/Main\/dep.js"\)/);
  assert.match(result.files[0].source, /import.meta.url/);
});

test("decodes escaped module strings without eval", async (t) => {
  t.mock.method(globalThis, "eval", () => {
    throw new Error("CSP blocks eval");
  });
  const result = await prepareExecution(
    [
      { path: "Main/index.js", source: String.raw`import './d\u0065p.js';` },
      { path: "Main/dep.js", source: "export const value = 1;" },
    ],
    { files: [], imports: {} },
  );
  assert.equal(result.files[0].source, 'import "playground/Main/dep.js";');
});
