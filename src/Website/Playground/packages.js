// Registry archives stay in the browser. Neither sources nor notices are evaluated here.
const archiveCache = "alexandrite-registry-archives-v1";
const decoder = new TextDecoder();

async function readBytes(stream, limit) {
  const reader = stream.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) throw new Error("Package archive exceeds size limit");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}

export async function verifyArchive(bytes, pkg) {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const integrity = `sha256-${btoa(String.fromCharCode(...hash))}`;
  if (bytes.length !== pkg.archive.bytes || integrity !== pkg.archive.integrity) {
    throw new Error(`Archive integrity mismatch: ${pkg.name}@${pkg.version}`);
  }
}

export async function extractArchive(bytes, pkg) {
  const tar = await readBytes(
    new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),
    32 * 1024 * 1024,
  );
  const files = [], notices = [];
  const root = `${pkg.name}-${pkg.version}/`;
  let extendedPath;
  let entries = 0;
  for (let offset = 0; offset + 512 <= tar.length;) {
    if (++entries > 10000) throw new Error("Too many archive entries");
    const header = tar.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) break;
    const field = (start, length) => decoder.decode(header.subarray(start, start + length)).replace(/\0.*$/s, "");
    const rawSize = field(124, 12).trim();
    if (!/^[0-7]+$/.test(rawSize)) throw new Error("Invalid tar entry size");
    const size = parseInt(rawSize, 8);
    if (size > 8 * 1024 * 1024 || offset + 512 + size > tar.length) throw new Error("Invalid tar entry size");
    const body = tar.subarray(offset + 512, offset + 512 + size);
    const type = field(156, 1);
    const prefix = field(345, 155);
    const path = extendedPath ?? `${prefix ? `${prefix}/` : ""}${field(0, 100)}`;
    offset += 512 + Math.ceil(size / 512) * 512;
    if (type === "x") {
      for (let position = 0; position < body.length;) {
        const space = body.indexOf(32, position);
        const length = Number(decoder.decode(body.subarray(position, space)));
        if (space < position || !Number.isSafeInteger(length) || length <= space - position + 1 || position + length > body.length) throw new Error("Invalid PAX entry");
        const record = decoder.decode(body.subarray(space + 1, position + length - 1));
        if (record.startsWith("path=")) extendedPath = record.slice(5);
        position += length;
      }
      continue;
    }
    if (type === "L") { extendedPath = decoder.decode(body).replace(/\0.*$/s, ""); continue; }
    extendedPath = undefined;
    const relative = path.slice(root.length).replace(/\/$/, "");
    if (!path.startsWith(root) || path.length > 4096 || path.includes("\\") ||
        relative.split("/").some(part => part === ".." || part === "." || (!part && relative))) {
      throw new Error(`Unsafe archive path: ${path}`);
    }
    if (type === "5") continue;
    if (type !== "0" && type !== "") throw new Error(`Archive entry is not a regular file: ${path}`);
    if (relative.startsWith("src/") && /\.(purs|js|jsx)$/.test(relative)) {
      files.push({ path: `packages/${pkg.name}/${relative}`, source: decoder.decode(body) });
    }
    if (/(^|\/)(licen[cs]e|copying|notice|copyright)([._-].*|$)/i.test(relative)) {
      notices.push({ path: relative, source: decoder.decode(body) });
    }
  }
  if (!files.some(file => file.path.endsWith(".purs"))) throw new Error(`No PureScript sources: ${pkg.name}`);
  for (const collection of [files, notices]) {
    collection.sort((a, b) => a.path.localeCompare(b.path));
    if (new Set(collection.map(file => file.path)).size !== collection.length) throw new Error("Duplicate archive paths");
  }
  return { files, notices };
}

export async function loadArchive(pkg, { fetchImpl = fetch, cacheStorage = globalThis.caches,
  attempts = 3, delay = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  const key = `${pkg.archive.url}?integrity=${encodeURIComponent(pkg.archive.integrity)}`;
  let cache;
  try { cache = await cacheStorage?.open(archiveCache); } catch { /* Storage may be disabled. */ }
  try {
    const cached = await cache?.match(key);
    if (cached) {
      const bytes = await readBytes(cached.body, pkg.archive.bytes);
      await verifyArchive(bytes, pkg);
      return await extractArchive(bytes, pkg);
    }
  } catch { await cache?.delete(key).catch(() => {}); }
  let cause;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetchImpl(pkg.archive.url, {
        mode: "cors", credentials: "omit", cache: attempt ? "reload" : "force-cache",
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = await readBytes(response.body, pkg.archive.bytes);
      await verifyArchive(bytes, pkg);
      const contents = await extractArchive(bytes, pkg);
      // Quota/disabled storage must not prevent compilation. Only verified bytes are saved.
      await cache?.put(key, new Response(bytes)).catch(() => {});
      return contents;
    } catch (error) {
      cause = error;
      if (attempt + 1 < attempts) await delay(500 * 2 ** attempt);
    }
  }
  throw new Error(`Could not download ${pkg.name}@${pkg.version} from the Registry. Check your connection and retry.`, { cause });
}

export async function loadPackages(packages, onProgress = () => {}, options) {
  const loaded = new Array(packages.length);
  let next = 0, completed = 0;
  await Promise.all(Array.from({ length: Math.min(8, packages.length) }, async () => {
    while (next < packages.length) {
      const index = next++;
      const pkg = packages[index];
      const contents = await loadArchive(pkg, options);
      loaded[index] = { pkg, ...contents };
      onProgress(++completed, packages.length);
    }
  }));
  return {
    files: loaded.flatMap(item => item.files),
    packages: loaded.map(({ pkg, notices }) => ({
      ...pkg, notices,
      pursuitUrl: `https://pursuit.purescript.org/packages/purescript-${pkg.name}/${pkg.version}`,
      repositoryUrl: pkg.location.githubOwner
        ? `https://github.com/${pkg.location.githubOwner}/${pkg.location.githubRepo}/tree/${encodeURIComponent(pkg.ref)}`
        : pkg.location.gitUrl,
    })),
  };
}
