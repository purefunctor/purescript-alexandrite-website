import manifest from "../../../playground/packages/manifest.json";
import assets from "../../../build/playground-assets.json";
import { loadPackages } from "./packages.js";

let compiler;

self.onmessage = async ({ data }) => {
  try {
    if (data.type === "initialize") {
      // Absolute URLs keep Vite from treating generated public assets as source imports.
      const wasmModule = new URL(
        assets.compiler,
        self.location.origin,
      ).href;
      const [{ default: initialize, Compiler }, bundle] = await Promise.all([
        import(/* @vite-ignore */ wasmModule),
        loadPackages(manifest.packages, (loaded, total) => {
          self.postMessage({ type: "progress", message: `Loading packages… ${loaded}/${total}` });
        }),
      ]);
      await initialize();
      compiler = new Compiler(bundle.files);
      self.postMessage({ type: "ready", packages: bundle.packages });
    } else if (data.type === "compile") {
      if (!compiler) throw new Error("The compiler is not ready.");
      const start = performance.now();
      const result = compiler.compile(data.files);
      self.postMessage({
        type: "result",
        id: data.id,
        ...result,
        duration: performance.now() - start,
      });
    }
  } catch (error) {
    // A WASM trap can poison compiler state. The UI will discard this worker.
    self.postMessage({
      type: "failure",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
