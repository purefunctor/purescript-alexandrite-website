# Playground package sources

`manifest.json` is the checked-in source-package lock for the playground, independent of the website's Spago dependency set. Normal website builds validate and embed only this metadata in the compiler worker. They do not download or publish the playground's Registry package sources.

At initialization, `Website/Playground/packages.js` runs inside the compiler worker and downloads archives directly from `https://packages.registry.purescript.org/<name>/<version>.tar.gz`, with CORS and credentials omitted. Eight concurrent loads report progress to the UI. SHA-256 and exact byte length are checked against the lock before extraction. Sources become `{ path, source }` inputs to WASM, with paths `packages/<name>/src/<relative-path>`. Only `src/**/*.purs`, `.js`, and `.jsx` are compiler inputs. Public modules such as `Test.QuickCheck` and `Test.Assert` remain; package-root tests/examples are excluded. FFI is text only and is never evaluated in the host or compiler worker.

Verified compressed archives persist in Cache Storage `alexandrite-registry-archives-v1`, keyed by URL and pinned integrity. Every cache read is reverified; corrupt entries are discarded and downloaded again. Storage failures do not block compilation. Network requests have a 15-second timeout and three bounded attempts; loading progress renews the client's inactivity timeout. The browser's HTTP cache is also reused. Storage is evictable and this is not an offline app-shell guarantee.

Extraction uses `DecompressionStream` and a bounded in-memory tar reader, with no filesystem extraction or symlink following. Limits are 32 MiB decompressed per archive, 8 MiB per entry, 10,000 entries, and 4,096-character paths. Traversal, foreign roots, non-regular files, and duplicate selected paths are rejected. License/LICENCE, COPYING, NOTICE, and COPYRIGHT files are collected separately as plain text and displayed in a dialog. The Registry does not guarantee NOTICE files are included: missing notices are explicitly reported with an upstream link. License identifiers and repository/ref links come from the lock; Pursuit links target the pinned version.

The compiler/WASM and React runtime remain built assets. `build-playground-assets.mjs` publishes them under content-addressed `/playground/assets/<sha256>/` URLs with one-year immutable caching. The generated asset URLs are embedded into Vite bundles; playground HTML revalidates so updates select new URLs. The program-execution frame retains `connect-src 'none'`; only the trusted host/worker can contact the Registry.

For explicit compiler integration tests only, `node scripts/build-playground-packages.mjs --fixture` emits `build/playground-packages.json` with `{ packages, files }`, reusing verified disk archives from `node_modules/.cache/playground-packages/`. This ignored fixture is not published. Normal builds remove the legacy `public/playground/packages.json` artifact.

## Selection and provenance

The current lock uses Registry package set **80.8.1**, published **2026-08-31**, compiler **0.15.15**. It was the highest semantic version in the authoritative Registry snapshot recorded by `registry.revision`. The exact package-set file SHA-256 and Registry-index revision are also recorded. Root membership is all packages in that set whose current Registry metadata GitHub owner is `purescript`, plus `halogen`, `react-basic`, and `react-basic-hooks`. This gives **62 roots** (59 organization packages plus 3 explicit additions), and **85 packages** after transitive dependency closure. License expressions, source repository/ref, publication time and archive integrity come from Registry metadata and Registry-index manifests.

Package-set versions are authoritative, not re-solved from dependency ranges. Ranges are retained as provenance: for example, the set pins `aff@8.0.0` while `react-basic-hooks@9.1.1` declares `aff >=7.0.0 <8.0.0`. The loader preserves the requested set rather than silently downgrading it; compiler compatibility belongs to the integration checks.

To regenerate reproducibly, clone `https://github.com/purescript/registry` and `https://github.com/purescript/registry-index`, check out the exact revisions recorded in the lock, then run:

```sh
node scripts/build-playground-packages.mjs --lock /path/to/registry /path/to/registry-index
```

Both checkouts must be clean. To deliberately update, use fresh authoritative snapshots instead; the maintenance command selects their latest set and rewrites the lock. Review changed roots, licenses and versions, then update the count/version assertions and this contract. Additional roots can be added to the maintenance command's `extras` list without changing the output API; no package-selection UI is involved.

## Verification

```sh
node --test playground/packages/*.test.mjs
PLAYGROUND_REGISTRY=/path/to/registry PLAYGROUND_REGISTRY_INDEX=/path/to/registry-index node --test playground/packages/*.test.mjs
```

The second command additionally proves the complete lock and root selection reproduce from the pinned authoritative snapshots. The first is offline and covers closure, source/notice filtering, integrity, retries, browser-cache corruption recovery and unavailable storage, progress, documentation links, and deterministic test-fixture output.
