import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { prepareExecution } from "../src/Website/Playground/runtime.js";

// Requires agent-browser and a running dev or production preview server.
const url = process.argv[2] || "http://localhost:4321/playground";
const session = `playground-test-${process.pid}`;
const browser = (...args) =>
  execFileSync("agent-browser", ["--session", session, ...args], {
    encoding: "utf8",
    maxBuffer: 5 * 1024 * 1024,
  });
const evaluate = (code) =>
  JSON.parse(
    execFileSync("agent-browser", ["--session", session, "eval", "--stdin"], {
      input: code,
      encoding: "utf8",
      maxBuffer: 5 * 1024 * 1024,
    }),
  );
const wait = (code) => browser("wait", "--fn", code);
const status = () =>
  evaluate('document.getElementById("compile-status").textContent');
const compile = (source) => {
  browser("focus", '[aria-label="PureScript source editor"]');
  browser("press", "Control+a");
  browser("keyboard", "inserttext", source);
  wait(
    '/Compiled in|^\\d+ errors?$/.test(document.getElementById("compile-status").textContent)',
  );
};
const run = () => {
  browser("click", "#tab-result");
  wait(
    '!!document.querySelector("[data-runtime-ready=true]") || (!!document.querySelector("#panel-result [role=status]") && !document.querySelector("#panel-result [role=status]").textContent.match(/Waiting|Preparing|Running/))',
  );
};

try {
  browser("open", url);
  browser("set", "viewport", "1440", "1000");
  wait(
    'document.getElementById("compile-status")?.textContent.startsWith("Compiled in")',
  );
  assert.equal(
    evaluate('document.querySelectorAll(".monaco-editor").length'),
    2,
  );
  run();
  assert.match(browser("snapshot"), /Hello, Alexandrite!/);
  assert.match(browser("snapshot"), /49/);
  assert.equal(
    evaluate('document.querySelector("iframe").getAttribute("sandbox")'),
    "allow-scripts",
  );
  assert.equal(
    evaluate('document.querySelector("iframe").getAttribute("referrerpolicy")'),
    "no-referrer",
  );
  assert.equal(evaluate('document.getElementById("package-list").open'), false);
  evaluate(`(() => {
    const fetch = window.fetch;
    window.fetch = (...args) => {
      if (!String(args[0]).endsWith("/runtime.json")) return fetch(...args);
      window.fetch = fetch;
      return new Promise(resolve => {
        window.releaseRuntime = () => resolve(fetch(...args));
      });
    };
    return true;
  })()`);
  browser("select", '[aria-label="Example"]', "1");
  wait('!!document.querySelector("[role=status][aria-label^=Preparing]")');
  assert.equal(
    evaluate('document.querySelector("#panel-result [role=status]")'),
    null,
  );
  assert.equal(
    evaluate(
      'getComputedStyle(document.querySelector("[aria-label^=Preparing] svg")).animationPlayState',
    ),
    "running",
  );
  assert.equal(
    evaluate(
      'getComputedStyle(document.querySelector("[aria-label^=Preparing] svg")).width',
    ),
    "18px",
  );
  browser("set", "media", "light", "reduced-motion");
  assert.equal(
    evaluate(
      'getComputedStyle(document.querySelector("[aria-label^=Preparing] svg")).animationPlayState',
    ),
    "paused",
  );
  evaluate("window.releaseRuntime(); delete window.releaseRuntime; true");
  wait(
    'document.getElementById("compile-status").textContent.startsWith("Compiled in")',
  );
  run();
  const resultFrame = browser("snapshot").match(
    /Iframe "JavaScript result" \[ref=(e\d+)\]/,
  )[1];
  browser("frame", `@${resultFrame}`);
  browser("wait", "#root button");
  browser("find", "role", "button", "click", "--name", "+", "--exact");
  assert.equal(browser("get", "text", "#root > div > div").trim(), "1");
  browser("find", "role", "button", "click", "--name", "−", "--exact");
  assert.equal(browser("get", "text", "#root > div > div").trim(), "0");
  browser("find", "role", "button", "click", "--name", "+", "--exact");
  browser("find", "role", "button", "click", "--name", "Reset", "--exact");
  assert.equal(browser("get", "text", "#root > div > div").trim(), "0");
  assert.match(browser("get", "attr", "#root > div", "style"), /display: flex/);
  browser("frame", "main");
  browser("select", '[aria-label="Example"]', "2");
  wait(
    'document.getElementById("compile-status").textContent.startsWith("Compiled in")',
  );
  run();
  assert.match(browser("snapshot"), /Sum: 220/);
  browser("select", '[aria-label="Example"]', "0");
  wait(
    'document.getElementById("compile-status").textContent.startsWith("Compiled in")',
  );
  run();
  assert.match(browser("snapshot"), /Hello, Alexandrite!/);
  browser("click", "#tab-javascript");
  assert.equal(
    evaluate('document.getElementById("panel-result").hidden'),
    true,
  );
  assert.equal(
    evaluate('document.querySelectorAll("iframe").length'),
    1,
    "switching tabs preserves the result",
  );

  compile('module Main where\nmain :: Int\nmain = "wrong"');
  assert.match(status(), /1 error/);
  assert.match(browser("get", "text", "body"), /Cannot unify/);
  assert.equal(
    evaluate('document.querySelectorAll("iframe").length'),
    0,
    "edits discard the old runtime",
  );

  compile("module Main where\nvalue = 1");
  assert.match(status(), /Compiled in/);
  run();
  assert.match(browser("snapshot"), /Export a callable main/);

  compile("module Main where\nmain :: Int -> Int\nmain _ = 42");
  assert.match(status(), /Compiled in/);
  run();
  assert.equal(
    evaluate('!!document.querySelector("[data-runtime-ready=true]")'),
    true,
    "no Effect Unit signature enforcement",
  );
  assert.equal(
    evaluate('document.querySelector("#panel-result [role=status]")'),
    null,
  );
  assert.equal(
    evaluate('document.getElementById("tab-result").textContent'),
    "Runtime",
  );
  assert.equal(
    evaluate(
      'Array.from(document.querySelector("[role=tablist]").parentElement.querySelectorAll("button")).map(button => button.textContent).join(",")',
    ),
    "JavaScript,Runtime,Restart,Stop",
  );

  compile(
    'module Main where\nimport Prelude\nimport Effect (Effect)\nimport Effect.Exception (throw)\nmain :: Effect Unit\nmain = throw "Runtime failure example"',
  );
  run();
  assert.match(browser("snapshot"), /Runtime failure example/);

  compile(
    'module Main where\nimport Prelude\nimport Effect.Console (log)\nmain = log "<img src=x onerror=alert(1)>"',
  );
  run();
  assert.match(browser("snapshot"), /<img src=x onerror=alert\(1\)>/);
  browser("find", "role", "button", "click", "--name", "Stop", "--exact");
  assert.equal(evaluate('document.querySelectorAll("iframe").length'), 0);
  browser("click", "#tab-javascript");
  browser("find", "role", "button", "click", "--name", "Restart", "--exact");
  wait('!!document.querySelector("[data-runtime-ready=true]")');
  assert.equal(evaluate('document.querySelectorAll("iframe").length'), 1);
  assert.equal(
    evaluate(
      'document.getElementById("tab-javascript").getAttribute("aria-selected")',
    ),
    "true",
  );

  // Real sandbox policy, real module imports, React DOM and modern Hooks; no
  // user source or generated module is ever evaluated by the host page.
  const runtime = JSON.parse(
    await readFile(
      new URL("../build/playground-runtime/runtime.json", import.meta.url),
    ),
  );
  const execution = await prepareExecution(
    [
      {
        path: "Probe/index.js",
        source: `
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    export async function main() {
      const checks = {};
      try { parent.document.body; checks.parentDOM = false; } catch { checks.parentDOM = true; }
      try { localStorage.getItem('probe'); checks.storage = false; } catch { checks.storage = true; }
      try { await fetch('https://example.com'); checks.network = false; } catch { checks.network = true; }
      checks.worker = await new Promise(resolve => {
        try {
          const worker = new Worker(URL.createObjectURL(new Blob(['postMessage(1)'])));
          worker.onmessage = () => {worker.terminate(); resolve(false)};
          worker.onerror = () => {worker.terminate(); resolve(true)};
        } catch { resolve(true); }
      });
      function App() {
        const [value] = React.useState('React rendered');
        React.useEffectEvent(() => {});
        React.useEffect(() => {
          checks.react = document.getElementById('root').textContent === value;
          parent.postMessage({type:'sandbox-probe', checks}, '*');
        }, []);
        return React.createElement('p', null, value);
      }
      ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
    }
  `,
      },
    ],
    runtime,
  );
  const probe = evaluate(`(async () => {
    const frame = document.createElement('iframe');
    frame.sandbox = 'allow-scripts'; frame.src = '/playground-sandbox.html';
    const result = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Sandbox probe timed out')), 10000);
      const receive = event => {
        if (event.source !== frame.contentWindow) return;
        if (event.data?.type === 'execution' && event.data.phase === 'error') {
          clearTimeout(timer); window.removeEventListener('message', receive);
          reject(new Error(event.data.message)); frame.remove(); return;
        }
        if (event.data?.type !== 'sandbox-probe') return;
        clearTimeout(timer); window.removeEventListener('message', receive);
        resolve({origin:event.origin, ...event.data.checks}); frame.remove();
      };
      window.addEventListener('message', receive);
    });
    frame.onload = () => frame.contentWindow.postMessage({type:'execute',id:1,colors:{background:'white',foreground:'black'},...${JSON.stringify(execution)}}, '*');
    document.body.append(frame); return await result;
  })()`);
  assert.deepEqual(probe, {
    origin: "null",
    parentDOM: true,
    storage: true,
    network: true,
    worker: true,
    react: true,
  });

  for (const width of [390, 320]) {
    browser("set", "viewport", String(width), "844");
    assert.equal(
      evaluate("document.documentElement.scrollWidth <= innerWidth"),
      true,
      `no page overflow at ${width}px`,
    );
  }
  browser("focus", "#tab-javascript");
  browser("press", "ArrowRight");
  assert.equal(evaluate("document.activeElement.id"), "tab-result");
  browser(
    "find",
    "role",
    "button",
    "click",
    "--name",
    "Packages (85)",
    "--exact",
  );
  assert.equal(
    evaluate('document.querySelectorAll("#package-list li").length'),
    85,
  );
  assert.equal(evaluate("document.activeElement.textContent"), "Close");
  for (const [position, top, bottom] of [
    ["0", "1", "0"],
    ["20", "0.5", "0"],
    ["200", "0", "0"],
    ["list.scrollHeight - list.clientHeight - 20", "0", "0.5"],
    ["list.scrollHeight", "0", "1"],
  ]) {
    evaluate(`(() => {
      const list = document.querySelector("#package-list ul");
      list.scrollTop = ${position};
      return true;
    })()`);
    wait(`(() => {
      const style = document.querySelector("#package-list ul").style;
      return style.getPropertyValue("--package-top-opacity") === "${top}"
        && style.getPropertyValue("--package-bottom-opacity") === "${bottom}";
    })()`);
  }
  assert.equal(evaluate('document.getElementById("package-list").matches(":modal")'), true);
  assert.equal(evaluate(`(() => {
    const bounds = document.getElementById("package-list").getBoundingClientRect();
    return bounds.top === 0 && bounds.height === innerHeight;
  })()`), true);
  // Native dialogs allow a stop at browser chrome before cycling back inside.
  browser("press", "Tab");
  browser("press", "Tab");
  assert.equal(evaluate('document.getElementById("package-list").contains(document.activeElement)'), true);
  assert.equal(
    evaluate(
      'document.getElementById("package-list").getAnimations({ subtree: true }).length',
    ),
    0,
  );
  assert.equal(
    evaluate(
      'Math.abs(document.getElementById("package-list").getBoundingClientRect().right - innerWidth) < 1',
    ),
    true,
  );
  browser("press", "Escape");
  assert.equal(evaluate('document.getElementById("package-list").open'), false);
  assert.equal(evaluate("document.activeElement.textContent"), "Packages (85)");
  browser("set", "viewport", "1728", "979");
  const sourceWidth = evaluate(
    'document.querySelector("[aria-label=Source]").getBoundingClientRect().width',
  );
  browser(
    "find",
    "role",
    "button",
    "click",
    "--name",
    "Packages (85)",
    "--exact",
  );
  assert.equal(
    evaluate(
      'Math.abs(document.getElementById("package-list").getBoundingClientRect().right - innerWidth) < 1',
    ),
    true,
  );
  assert.equal(
    evaluate(
      'document.querySelector("[aria-label=Source]").getBoundingClientRect().width',
    ),
    sourceWidth,
  );
  assert.equal(
    evaluate('document.querySelector("header h1 a").textContent'),
    "ALEXANDRITE",
  );
  browser("find", "role", "button", "click", "--name", "Close", "--exact");
  console.log(
    "Browser checks passed: automatic WASM compile and main() execution, diagnostics/recovery, signature flexibility, runtime errors, text-only logs, tab/stop lifecycle, React 19 mounted in #root, sandbox isolation, keyboard tabs, packages, 390px and 320px layout.",
  );
} finally {
  browser("close");
}
