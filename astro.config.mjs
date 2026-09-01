import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import stylex from "@stylexjs/unplugin";
import icons from "unplugin-icons/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  adapter: cloudflare({ imageService: "passthrough" }),
  integrations: [react()],
  output: "server",
  session: false,
  server: {
    host: process.env.AMP_ORB === "1",
    port: process.env.PORT ? Number(process.env.PORT) : 4321,
  },
  vite: {
    plugins: [
      icons({ compiler: "jsx", jsx: "react" }),
      stylex.vite({
        dev: process.env.NODE_ENV === "development",
        runtimeInjection: false,
        useCSSLayers: true,
      }),
    ],
    server: {
      allowedHosts: process.env.AMP_ORB ? true : undefined,
      strictPort: process.env.PORT !== undefined,
    },
  },
});
