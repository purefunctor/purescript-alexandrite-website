# Playground package sources

`manifest.json` is the checked-in source-package lock for the playground. It is independent of the website's Spago dependency set. Normal builds never resolve versions or contact GitHub: they fetch only pinned Registry archives, check their Registry SHA-256 and byte length, and reuse verified archives from `node_modules/.cache/playground-packages/`.

Run `node scripts/build-playground-packages.mjs` before the website build. It emits `public/playground/packages.json` with `{ packages: [{ name, version, license, location, ref, publishedTime, dependencies, archive }], files: [{ path, source }] }`. Paths are `packages/<name>/src/<relative-path>`; source is UTF-8 text. Only `src/**/*.purs`, `.js`, and `.jsx` are included. Package-root tests, examples, documentation and manifests are excluded. Public modules such as `Test.QuickCheck` and `Test.Assert` remain: these are library API sources, not package test suites. FFI is text only; bundling does not execute it or install npm dependencies.

The output is deterministic (sorted package and file paths, no build timestamp) and published by atomic rename only after the complete build succeeds. Fetches have timeouts and three bounded attempts. A failed build is recoverable by rerunning; partial or corrupt caches are never trusted. The generated public file must be ignored by the integrating website. No source archives are checked in.

## Selection and provenance

The current lock uses Registry package set **80.8.1**, published **2026-08-31**, compiler **0.15.15**. It was the highest semantic version in the authoritative Registry snapshot recorded by `registry.revision`. The exact package-set file SHA-256 and Registry-index revision are also recorded. Root membership is all packages in that set whose current Registry metadata GitHub owner is `purescript`, plus `halogen`, `react-basic`, and `react-basic-hooks`. This gives **62 roots** (59 organization packages plus 3 explicit additions), and **85 packages** after transitive dependency closure. License expressions, source repository/ref, publication time and archive integrity come from Registry metadata and Registry-index manifests.

Package-set versions are authoritative, not re-solved from dependency ranges. Ranges are retained as provenance: for example, the set pins `aff@8.0.0` while `react-basic-hooks@9.1.1` declares `aff >=7.0.0 <8.0.0`. This bundler preserves the requested set rather than silently downgrading it; compiler compatibility belongs to the integration checks.

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

The second command additionally proves the complete lock and root selection reproduce from the pinned authoritative snapshots. The first is offline and covers closure, source filtering, integrity, bounded retry, offline cache reuse, deterministic output and preservation of prior output on failure.
