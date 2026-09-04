# Alexandrite website

The Alexandrite website uses Astro for routing and server rendering on Cloudflare Workers. Its React components are implemented in PureScript and compiled with Alexandrite.

Use Node.js 22 and pnpm 12.3.4 (pinned in `package.json`). To install the pinned package manager and dependencies:

```sh
npm install --global pnpm@12.3.4
pnpm install --frozen-lockfile
```

```sh
pnpm dev      # Watch PureScript and run Astro locally
pnpm build    # Compile PureScript and build the Cloudflare Worker
pnpm preview  # Run the production build in workerd
pnpm deploy   # Build and deploy with Wrangler
```

Astro server-renders routes by default. Add `export const prerender = true` to an Astro page when it can be generated as a static asset instead.
