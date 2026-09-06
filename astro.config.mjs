import node from "@astrojs/node";
import react from "@astrojs/react";
import stylex from "@stylexjs/unplugin";
import icons from "unplugin-icons/vite";
import { defineConfig } from "astro/config";

// Astro sets NODE_ENV before loading config.
const development = process.env.NODE_ENV === "development";

export default defineConfig({
  adapter: node({ mode: "middleware" }),
  integrations: [react()],
  output: "server",
  session: false,
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'none'",
        "object-src 'none'",
        "frame-src 'self'",
        "frame-ancestors 'none'",
        "form-action 'none'",
        "connect-src 'self' https://packages.registry.purescript.org",
        "worker-src 'self'",
        "img-src 'self' data:",
      ],
      scriptDirective: { resources: ["'self'", "'wasm-unsafe-eval'"] },
      // Monaco generates theme styles and positions editor elements inline.
      styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
    },
  },
  server: {
    host: process.env.AMP_ORB === "1",
    allowedHosts: process.env.AMP_ORB ? [".onamp.dev"] : [],
    port: process.env.PORT ? Number(process.env.PORT) : 4321,
  },
  vite: {
    // A production build/sync must not replace a live dev server's prebundles.
    cacheDir: development
      ? "node_modules/.vite-dev"
      : "node_modules/.vite-build",
    // Generated PureScript and the lazy editor are not all visible to the
    // initial dependency scan. Prebundle before serving the first request.
    optimizeDeps: {
      include: [
        "@stylexjs/stylex",
        "acorn",
        "motion/mini",
        "react-aria-components",
        "react-aria-components/Modal",
        "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution.js",
        "monaco-editor/esm/vs/editor/editor.api.js",
      ],
    },
    // StyleX aggregates all rules into one CSS asset. Keep it shared between
    // routes rather than attaching it to Monaco's lazy editor stylesheet.
    build: { cssCodeSplit: false },
    plugins: [
      icons({ compiler: "jsx", jsx: "react" }),
      stylex.vite({
        dev: development,
        runtimeInjection: false,
        useCSSLayers: true,
      }),
    ],
    server: {
      strictPort: process.env.PORT !== undefined,
    },
  },
});
