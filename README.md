# Alexandrite website

The Alexandrite website uses Astro for routing and server rendering on Cloudflare Workers. Its React components are implemented in PureScript and compiled with Alexandrite.

```sh
pnpm dev      # Watch PureScript and run Astro locally
pnpm build    # Compile PureScript and build the Cloudflare Worker
pnpm preview  # Run the production build in workerd
pnpm deploy   # Build and deploy with Wrangler
```

Astro server-renders routes by default. Add `export const prerender = true` to an Astro page when it can be generated as a static asset instead.
