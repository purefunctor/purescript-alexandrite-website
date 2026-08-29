import stylex from "@stylexjs/unplugin";
import icons from "unplugin-icons/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    icons({ compiler: "jsx", jsx: "react" }),
    stylex.vite({
      dev: process.env.NODE_ENV === "development",
      runtimeInjection: false,
      useCSSLayers: true,
    }),
  ],
  build: {
    outDir: "build",
    target: "esnext",
  },
  experimental: {
    bundledDev: true,
  },
  server: {
    allowedHosts: process.env.AMP_ORB ? true : undefined,
    host: process.env.AMP_ORB ? "0.0.0.0" : undefined,
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
    strictPort: process.env.PORT !== undefined,
  },
});
