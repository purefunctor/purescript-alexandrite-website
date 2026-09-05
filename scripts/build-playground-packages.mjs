import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifestPath = resolve(root, 'playground/packages/manifest.json');
const extras = ['halogen', 'react-basic', 'react-basic-hooks'];
const digest = bytes => `sha256-${createHash('sha256').update(bytes).digest('base64')}`;
const json = bytes => JSON.parse(bytes.toString());
const sorted = values => [...values].sort();

// Registry-index uses the same name sharding scheme as the Cargo index.
function indexPath(name) {
  if (name.length < 3) return `${name.length}/${name}`;
  if (name.length === 3) return `3/${name[0]}/${name}`;
  return `${name.slice(0, 2)}/${name.slice(2, 4)}/${name}`;
}

export function dependencyClosure(roots, packages) {
  const seen = new Set();
  function visit(name) {
    if (seen.has(name)) return;
    if (!packages[name]) throw new Error(`Missing dependency: ${name}`);
    seen.add(name);
    for (const dependency of Object.keys(packages[name].dependencies)) visit(dependency);
  }
  roots.forEach(visit);
  return sorted(seen);
}

// Explicit maintenance operation; normal builds never consult moving Git refs.
export async function makeManifest(registry, index) {
  const revision = directory => execFileSync('git', ['rev-parse', 'HEAD'], { cwd: directory, encoding: 'utf8' }).trim();
  for (const directory of [registry, index]) {
    if (execFileSync('git', ['status', '--porcelain'], { cwd: directory, encoding: 'utf8' }).trim()) {
      throw new Error(`Registry checkout must be clean: ${directory}`);
    }
  }
  const sets = (await readdir(resolve(registry, 'package-sets'))).filter(name => /^\d+\.\d+\.\d+\.json$/.test(name));
  sets.sort((a, b) => {
    const left = a.split('.').map(Number), right = b.split('.').map(Number);
    return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
  });
  const setBytes = await readFile(resolve(registry, 'package-sets', sets.at(-1)));
  const set = json(setBytes);
  const available = {};
  const roots = [];
  for (const name of sorted(Object.keys(set.packages))) {
    const version = set.packages[name];
    const metadata = json(await readFile(resolve(registry, `metadata/${name}.json`)));
    const entries = (await readFile(resolve(index, indexPath(name)), 'utf8')).trim().split('\n').map(JSON.parse);
    const entry = entries.find(entry => entry.version === version);
    const publication = metadata.published[version];
    if (!entry || !publication) throw new Error(`Missing Registry publication: ${name}@${version}`);
    if (metadata.location.githubOwner?.toLowerCase() === 'purescript' || extras.includes(name)) roots.push(name);
    available[name] = {
      name, version, license: entry.license, location: entry.location,
      ref: entry.ref, publishedTime: publication.publishedTime,
      dependencies: entry.dependencies,
      archive: {
        url: `https://packages.registry.purescript.org/${name}/${version}.tar.gz`,
        integrity: publication.hash, bytes: publication.bytes,
      },
    };
  }
  const manifest = {
    schemaVersion: 1,
    registry: { repository: 'https://github.com/purescript/registry', revision: revision(registry) },
    registryIndex: { repository: 'https://github.com/purescript/registry-index', revision: revision(index) },
    packageSet: { version: set.version, compiler: set.compiler, published: set.published, integrity: digest(setBytes) },
    selection: { githubOwner: 'purescript', additionalRoots: extras },
    roots,
    packages: dependencyClosure(roots, available).map(name => available[name]),
  };
  validateManifest(manifest);
  return manifest;
}

export function validateManifest(manifest) {
  if (manifest.schemaVersion !== 1 || !/^\d+\.\d+\.\d+$/.test(manifest.packageSet.version)) throw new Error('Unsupported package lock');
  const packages = Object.fromEntries(manifest.packages.map(pkg => [pkg.name, pkg]));
  const names = manifest.packages.map(pkg => pkg.name);
  if (JSON.stringify(names) !== JSON.stringify(dependencyClosure(manifest.roots, packages))) {
    throw new Error('Packages must be the sorted, unique, exact dependency closure');
  }
  for (const name of extras) if (!manifest.roots.includes(name)) throw new Error(`Missing required root: ${name}`);
  for (const pkg of manifest.packages) {
    if (!/^[a-z][a-z0-9-]*$/.test(pkg.name) || !/^\d+\.\d+\.\d+$/.test(pkg.version)
      || !pkg.license || !/^sha256-[A-Za-z0-9+/]{43}=$/.test(pkg.archive.integrity)
      || !Number.isSafeInteger(pkg.archive.bytes) || pkg.archive.bytes <= 0
      || pkg.archive.url !== `https://packages.registry.purescript.org/${pkg.name}/${pkg.version}.tar.gz`) {
      throw new Error(`Invalid package metadata: ${pkg.name}`);
    }
  }
}

export function verifyArchive(bytes, pkg) {
  if (bytes.length !== pkg.archive.bytes || digest(bytes) !== pkg.archive.integrity) {
    throw new Error(`Archive integrity mismatch: ${pkg.name}@${pkg.version}`);
  }
}

// Read tar in memory: never extract untrusted paths or symlinks to the filesystem.
export function sourceFiles(archive, pkg) {
  const tar = gunzipSync(archive);
  const files = [];
  let extendedPath;
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) break;
    const field = (start, length) => header.subarray(start, start + length).toString('utf8').replace(/\0.*$/s, '');
    const size = parseInt(field(124, 12).trim(), 8);
    if (!Number.isSafeInteger(size) || size < 0 || offset + 512 + size > tar.length) throw new Error('Invalid tar entry size');
    const body = tar.subarray(offset + 512, offset + 512 + size);
    const type = field(156, 1);
    const prefix = field(345, 155);
    const path = extendedPath ?? `${prefix ? `${prefix}/` : ''}${field(0, 100)}`;
    offset += 512 + Math.ceil(size / 512) * 512;
    if (type === 'x') {
      for (let position = 0; position < body.length;) {
        const space = body.indexOf(32, position);
        const length = Number(body.subarray(position, space).toString());
        if (space < position || !Number.isSafeInteger(length) || length <= space - position + 1 || position + length > body.length) throw new Error('Invalid PAX entry');
        const record = body.subarray(space + 1, position + length - 1).toString();
        if (record.startsWith('path=')) extendedPath = record.slice(5);
        position += length;
      }
      continue;
    }
    if (type === 'L') { extendedPath = body.toString().replace(/\0.*$/s, ''); continue; }
    extendedPath = undefined;
    const base = `${pkg.name}-${pkg.version}/src/`;
    if (!path.startsWith(base) || !/\.(purs|js|jsx)$/.test(path)) continue;
    if (path.split('/').some(part => part === '..' || part === '.' || !part) || path.includes('\\')) throw new Error(`Unsafe source path: ${path}`);
    if (type !== '0' && type !== '') throw new Error(`Source is not a regular file: ${path}`);
    files.push({ path: `packages/${pkg.name}/src/${path.slice(base.length)}`, source: body.toString('utf8') });
  }
  if (!files.some(file => file.path.endsWith('.purs'))) throw new Error(`No PureScript sources: ${pkg.name}`);
  return files;
}

export async function fetchArchive(pkg, { fetchImpl = fetch, attempts = 3, delay = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  let cause;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetchImpl(pkg.archive.url, { signal: AbortSignal.timeout(60_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      verifyArchive(bytes, pkg);
      return bytes;
    } catch (error) {
      cause = error;
      if (attempt + 1 < attempts) await delay(500 * 2 ** attempt);
    }
  }
  throw new Error(`Could not fetch ${pkg.name}@${pkg.version} after ${attempts} attempts. Retry the build; verified cached archives will be reused.`, { cause });
}

export async function build({ manifest = manifestPath, output = resolve(root, 'public/playground/packages.json'), cache = resolve(root, 'node_modules/.cache/playground-packages') } = {}) {
  const lock = json(await readFile(manifest));
  validateManifest(lock);
  await mkdir(cache, { recursive: true });
  const files = [];
  let next = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (next < lock.packages.length) {
      const pkg = lock.packages[next++];
      const cached = resolve(cache, `${pkg.name}-${pkg.version}.tar.gz`);
      let bytes;
      try { bytes = await readFile(cached); verifyArchive(bytes, pkg); } catch { bytes = undefined; }
      if (!bytes) { bytes = await fetchArchive(pkg); await writeFile(cached, bytes); }
      files.push(...sourceFiles(bytes, pkg));
    }
  }));
  files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  if (new Set(files.map(file => file.path)).size !== files.length) throw new Error('Duplicate source path');
  await mkdir(dirname(output), { recursive: true });
  const temporary = `${output}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify({ packages: lock.packages, files }));
  await rename(temporary, output);
  console.log(`Bundled ${lock.packages.length} packages and ${files.length} source files into ${output}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === '--lock') {
      if (process.argv.length !== 5) throw new Error('Usage: node scripts/build-playground-packages.mjs --lock <registry-checkout> <registry-index-checkout>');
      await mkdir(dirname(manifestPath), { recursive: true });
      await writeFile(manifestPath, `${JSON.stringify(await makeManifest(resolve(process.argv[3]), resolve(process.argv[4])), null, 2)}\n`);
    } else {
      if (process.argv.length !== 2) throw new Error('Unknown arguments');
      await build();
    }
  } catch (error) { console.error(error); process.exitCode = 1; }
}
