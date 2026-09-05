import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { gzipSync } from 'node:zlib';
import { build, dependencyClosure, fetchArchive, makeManifest, sourceFiles, validateManifest, verifyArchive } from '../../scripts/build-playground-packages.mjs';

const manifest = JSON.parse(await readFile(new URL('./manifest.json', import.meta.url)));

function tar(entries) {
  const blocks = [];
  for (const [path, source, type = '0'] of entries) {
    const body = Buffer.from(source);
    const header = Buffer.alloc(512);
    header.write(path);
    header.write(`${body.length.toString(8).padStart(11, '0')}\0`, 124);
    header.write(type, 156);
    blocks.push(header, body, Buffer.alloc((512 - body.length % 512) % 512));
  }
  return gzipSync(Buffer.concat([...blocks, Buffer.alloc(1024)]));
}

function packageFor(bytes, name = 'fixture') {
  return {
    name, version: '1.0.0', license: 'MIT', dependencies: {},
    archive: {
      url: `https://packages.registry.purescript.org/${name}/1.0.0.tar.gz`,
      integrity: `sha256-${createHash('sha256').update(bytes).digest('base64')}`,
      bytes: bytes.length,
    },
  };
}

test('latest pinned set has the expected roots and exact dependency closure', () => {
  validateManifest(manifest);
  assert.equal(manifest.packageSet.version, '80.8.1');
  assert.equal(manifest.roots.length, 62);
  assert.equal(manifest.packages.length, 85);
  const expectedRoots = manifest.packages.filter(pkg => pkg.location.githubOwner === 'purescript'
    || ['halogen', 'react-basic', 'react-basic-hooks'].includes(pkg.name)).map(pkg => pkg.name);
  assert.deepEqual(manifest.roots, expectedRoots);
  assert.ok(manifest.roots.includes('psci-support'));
  assert.ok(manifest.roots.includes('quickcheck'));
  assert.ok(!manifest.packages.some(pkg => pkg.name === 'yoga-react-dom'));
  const packages = Object.fromEntries(manifest.packages.map(pkg => [pkg.name, pkg]));
  assert.deepEqual(dependencyClosure(manifest.roots, packages), manifest.packages.map(pkg => pkg.name));
});

test('rejects missing dependencies, extra packages and missing explicit roots', () => {
  const missing = structuredClone(manifest);
  missing.packages = missing.packages.filter(pkg => pkg.name !== 'prelude');
  assert.throws(() => validateManifest(missing), /Missing dependency/);
  const extra = structuredClone(manifest);
  extra.packages.push({ ...extra.packages[0], name: 'unrelated' });
  assert.throws(() => validateManifest(extra), /exact dependency closure/);
  const roots = structuredClone(manifest);
  roots.roots = roots.roots.filter(name => name !== 'react-basic');
  assert.throws(() => validateManifest(roots), /Missing required root/);
});

test('source selection includes only src modules/FFI and preserves public Test modules', () => {
  const archive = tar([
    ['fixture-1.0.0/src/Main.purs', 'module Main where'],
    ['fixture-1.0.0/src/Main.js', 'export const x = 1;'],
    ['fixture-1.0.0/src/View.jsx', 'export const view = <div />;'],
    ['fixture-1.0.0/src/Test/Assert.purs', 'module Test.Assert where'],
    ['fixture-1.0.0/test/Main.purs', 'test'],
    ['fixture-1.0.0/examples/Main.purs', 'example'],
    ['fixture-1.0.0/src/notes.md', 'notes'],
    ['another-1.0.0/src/Main.purs', 'other'],
  ]);
  assert.deepEqual(sourceFiles(archive, packageFor(archive)).map(file => file.path), [
    'packages/fixture/src/Main.purs', 'packages/fixture/src/Main.js',
    'packages/fixture/src/View.jsx', 'packages/fixture/src/Test/Assert.purs',
  ]);
  assert.equal(sourceFiles(archive, packageFor(archive))[1].source, 'export const x = 1;');
});

test('rejects source traversal, symlinks and empty source packages', () => {
  for (const [path, type, message] of [
    ['fixture-1.0.0/src/../Main.purs', '0', /Unsafe source path/],
    ['fixture-1.0.0/src/Main.purs', '2', /not a regular file/],
    ['fixture-1.0.0/test/Main.purs', '0', /No PureScript sources/],
  ]) {
    const bytes = tar([[path, 'module Main where', type]]);
    assert.throws(() => sourceFiles(bytes, packageFor(bytes)), message);
  }
});

test('archive integrity detects both content and length corruption', () => {
  const bytes = Buffer.from('archive');
  const pkg = packageFor(bytes);
  verifyArchive(bytes, pkg);
  assert.throws(() => verifyArchive(Buffer.from('Archive'), pkg), /integrity mismatch/);
  assert.throws(() => verifyArchive(Buffer.from('archive!'), pkg), /integrity mismatch/);
});

test('fetch retries network, HTTP and integrity failures; exhaustion is actionable', async () => {
  const bytes = Buffer.from('archive');
  const pkg = packageFor(bytes);
  let calls = 0;
  const result = await fetchArchive(pkg, {
    attempts: 4, delay: async () => {}, fetchImpl: async () => {
      calls++;
      if (calls === 1) throw new Error('connection reset');
      if (calls === 2) return new Response('', { status: 503 });
      return new Response(calls === 3 ? 'corrupted' : bytes);
    },
  });
  assert.equal(calls, 4);
  assert.deepEqual(result, bytes);
  await assert.rejects(fetchArchive(pkg, {
    attempts: 2, delay: async () => {}, fetchImpl: async () => new Response('', { status: 503 }),
  }), /after 2 attempts. Retry the build/);
});

test('cached builds are offline, deterministic, namespaced and do not replace output on failure', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'playground-packages-test-'));
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => { throw new Error('Unexpected network access'); };
    const packages = [];
    for (const name of ['halogen', 'react-basic', 'react-basic-hooks']) {
      const bytes = tar([[`${name}-1.0.0/src/Main.purs`, 'module Main where']]);
      packages.push(packageFor(bytes, name));
      await writeFile(join(directory, `${name}-1.0.0.tar.gz`), bytes);
    }
    const lock = { schemaVersion: 1, packageSet: { version: '80.8.1' }, roots: packages.map(pkg => pkg.name), packages };
    const manifestPath = join(directory, 'manifest.json'), output = join(directory, 'packages.json');
    await writeFile(manifestPath, JSON.stringify(lock));
    await build({ manifest: manifestPath, output, cache: directory });
    const first = await readFile(output);
    await build({ manifest: manifestPath, output, cache: directory });
    assert.deepEqual(await readFile(output), first);
    assert.equal(JSON.parse(first).files.length, 3);
    lock.packages.pop();
    await writeFile(manifestPath, JSON.stringify(lock));
    await assert.rejects(build({ manifest: manifestPath, output, cache: directory }));
    assert.deepEqual(await readFile(output), first);
  } finally {
    globalThis.fetch = originalFetch;
    await rm(directory, { recursive: true, force: true });
  }
});

test('lock reproduces from authoritative pinned Registry snapshots', {
  skip: !process.env.PLAYGROUND_REGISTRY || !process.env.PLAYGROUND_REGISTRY_INDEX,
}, async () => {
  assert.deepEqual(await makeManifest(process.env.PLAYGROUND_REGISTRY, process.env.PLAYGROUND_REGISTRY_INDEX), manifest);
});
