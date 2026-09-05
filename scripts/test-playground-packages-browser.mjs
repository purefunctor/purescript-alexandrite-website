import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

// Run against a production preview to include the actual caching and CSP headers.
const url = process.argv[2];
if (!url) throw new Error("Usage: node scripts/test-playground-packages-browser.mjs <preview-playground-url>");
const session = `registry-test-${process.pid}`;
const browser = (...args) => execFileSync("agent-browser", ["--session", session, ...args], { encoding: "utf8" });
const evaluate = code => JSON.parse(browser("eval", code));
const wait = code => browser("wait", "--fn", code);
const compiled = () => wait('document.querySelector("#compile-status")?.textContent.startsWith("Compiled in")');
const assets = JSON.parse(await readFile(new URL("../build/playground-assets.json", import.meta.url)));
const manifest = JSON.parse(await readFile(new URL("../playground/packages/manifest.json", import.meta.url)));

try {
  const page = await fetch(url);
  assert.equal(page.status, 200);
  assert.equal(page.headers.get("cache-control"), "no-cache");
  for (const path of [assets.compiler, assets.compiler.replace(/\.js$/, "_bg.wasm"), assets.runtime]) {
    const response = await fetch(new URL(path, url));
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control"), /max-age=31536000, immutable/);
  }
  assert.equal((await fetch(new URL("/playground/packages.json", url))).status, 404);
  browser("open", url);
  compiled();
  assert.equal(evaluate('(async () => (await (await caches.open("alexandrite-registry-archives-v1")).keys()).length)()'), manifest.packages.length);

  for (const [width, height] of [[1440, 900], [390, 844]]) {
    browser("set", "viewport", String(width), String(height));
    browser("click", '[aria-controls="package-list"]');
    for (const pkg of manifest.packages) {
      assert.equal(evaluate(`document.querySelector('[data-package-license="${pkg.name}"]').closest('li').querySelector('a').href`),
        `https://pursuit.purescript.org/packages/purescript-${pkg.name}/${pkg.version}`);
    }
    browser("click", '[data-package-license="aff"]');
    assert.equal(evaluate('document.querySelector("[data-package-license-dialog]").matches(":modal")'), true);
    assert.equal(evaluate('getComputedStyle(document.querySelector("[data-package-license-dialog]")).borderTopWidth'), "0px");
    assert.match(evaluate('document.querySelector("[data-package-notice]").textContent'), /Apache License/);
    assert.equal(evaluate('document.querySelector("[data-package-license-dialog]").scrollWidth > document.querySelector("[data-package-license-dialog]").clientWidth'), false);
    browser("press", "Escape");
    assert.equal(evaluate('document.activeElement.getAttribute("data-package-license")'), "aff");
    assert.equal(evaluate('document.querySelector("#package-list").open'), true);
    browser("click", '[data-package-license="freeap"]');
    assert.match(evaluate('document.querySelector("[data-package-license-dialog]").textContent'), /no license or notice files/i);
    browser("click", '[data-package-license-dialog] button');
    browser("press", "Escape");
    wait('!document.querySelector("#package-list").open');
  }

  browser("set", "media", "reduced-motion");
  browser("click", '[aria-controls="package-list"]');
  browser("click", '[data-package-license="aff"]');
  assert.equal(evaluate('document.querySelector("[data-package-license-dialog]").getAnimations({ subtree: true }).length'), 0);
  browser("press", "Escape");
  browser("press", "Escape");

  browser("network", "route", "https://packages.registry.purescript.org/*", "--abort");
  browser("reload");
  compiled(); // Must work from Cache Storage with Registry traffic blocked.
  evaluate('caches.delete("alexandrite-registry-archives-v1")');
  browser("reload");
  wait('document.querySelector("#compile-status")?.textContent.includes("Could not download")');
  assert.equal(evaluate('document.querySelector("#compile-status").hidden'), false);
  browser("network", "unroute");
  browser("find", "role", "button", "click", "--name", "Retry compiler");
  compiled();
  console.log("Package browser checks passed: cold Registry downloads, verified persistent cache, blocked-network warm reload, cold failure/retry, 85 Pursuit links, desktop/mobile license dialogs, immutable assets and revalidated HTML.");
} finally {
  browser("close");
}
