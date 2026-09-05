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
  // Hold license animations at a deterministic frame to inspect both directions.
  evaluate(`(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      if (this.matches('[data-package-license-dialog]')) animation.pause();
      return animation;
    };
    return true;
  })()`);
  const finishLicense = () => {
    browser("eval", `document.querySelector('[data-package-license-dialog]').getAnimations({ subtree: true }).forEach(a => a.finish())`);
    wait('document.querySelector("[data-package-license-dialog]").getAnimations({ subtree: true }).length === 0');
    assert.equal(evaluate(`document.querySelector('[data-package-license-dialog]').style.transform`), "");
    assert.equal(evaluate(`document.querySelector('[data-package-license-dialog]').style.opacity`), "");
  };
  // Motion Mini uses one native animation per property, plus the backdrop.
  const licenseFrames = property => evaluate(`document.querySelector('[data-package-license-dialog]').getAnimations().find(a => !a.effect.pseudoElement && a.effect.getKeyframes()[0].${property} !== undefined).effect.getKeyframes().map(f => f.${property})`);

  for (const [width, height] of [[1440, 900], [390, 844]]) {
    browser("set", "viewport", String(width), String(height));
    browser("click", '[aria-controls="package-list"]');
    wait('document.querySelector("#package-list").open && document.querySelector("#package-list").getAnimations().length === 0');
    for (const pkg of manifest.packages) {
      assert.equal(evaluate(`document.querySelector('[data-package-license="${pkg.name}"]').closest('li').querySelector('a').href`),
        `https://pursuit.purescript.org/packages/purescript-${pkg.name}/${pkg.version}`);
    }
    browser("click", '[data-package-license="aff"]');
    wait('document.querySelector("[data-package-license-dialog]").getAnimations().length > 0');
    assert.deepEqual(licenseFrames("transform"), ["scale(0.96)", "scale(1)"]);
    assert.deepEqual(licenseFrames("opacity"), ["0", "1"]);
    finishLicense();
    assert.equal(evaluate('document.querySelector("[data-package-license-dialog]").matches(":modal")'), true);
    assert.equal(evaluate('getComputedStyle(document.querySelector("[data-package-license-dialog]")).borderTopWidth'), "0px");
    assert.match(evaluate('document.querySelector("[data-package-notice]").textContent'), /Apache License/);
    assert.equal(evaluate('document.querySelector("[data-package-license-dialog]").scrollWidth > document.querySelector("[data-package-license-dialog]").clientWidth'), false);
    browser("press", "Escape");
    wait('document.querySelector("[data-package-license-dialog]").getAnimations().length > 0');
    assert.equal(evaluate('document.querySelector("[data-package-license-dialog]").matches(":modal")'), true);
    assert.match(evaluate('document.querySelector("[data-package-notice]").textContent'), /Apache License/);
    assert.equal(licenseFrames("transform").at(-1), "scale(0.96)");
    assert.equal(licenseFrames("opacity").at(-1), "0");
    finishLicense();
    wait('!document.querySelector("[data-package-license-dialog]").open');
    assert.equal(evaluate('document.activeElement.getAttribute("data-package-license")'), "aff");
    assert.equal(evaluate('document.querySelector("#package-list").open'), true);
    browser("click", '[data-package-license="freeap"]');
    wait('document.querySelector("[data-package-license-dialog]").getAnimations().length > 0');
    // Dismiss before entry finishes: the exit must still preserve the content.
    assert.match(evaluate('document.querySelector("[data-package-license-dialog]").textContent'), /no license or notice files/i);
    browser("click", '[data-package-license-dialog] button');
    finishLicense();
    wait('!document.querySelector("[data-package-license-dialog]").open');
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
