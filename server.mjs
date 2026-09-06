import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import sirv from "sirv";
import { handler } from "#dist/server/entry.mjs";

const client = fileURLToPath(new URL("./dist/client/", import.meta.url));
const assets = sirv(client, {
  setHeaders(response, path) {
    // sirv supplies the decoded pathname, including extensionless HTML aliases.
    response.setHeader("X-Content-Type-Options", "nosniff");
    if (path.startsWith("/_astro/") || path.startsWith("/playground/assets/")) {
      response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
    if (path.startsWith("/playground-sandbox")) {
      response.setHeader("Content-Security-Policy", "sandbox allow-scripts");
      response.setHeader("Referrer-Policy", "no-referrer");
      response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
      response.setHeader("Cache-Control", "no-cache");
    }
  },
});

const port = Number(process.env.PORT || 4321);
const host = process.env.HOST || "0.0.0.0";
createServer((request, response) => {
  assets(request, response, () => handler(request, response));
}).listen(port, host, () => {
  console.log(`Website listening on ${host}:${port}`);
});
