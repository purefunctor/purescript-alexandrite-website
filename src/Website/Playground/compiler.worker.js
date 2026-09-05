let compiler;

self.onmessage = async ({ data }) => {
  try {
    if (data.type === "initialize") {
      // Absolute URLs keep Vite from treating generated public assets as source imports.
      const wasmModule = new URL(
        "/playground/wasm/playground_compiler.js",
        self.location.origin,
      ).href;
      const [{ default: initialize, Compiler }, response] = await Promise.all([
        import(/* @vite-ignore */ wasmModule),
        fetch("/playground/packages.json"),
      ]);
      if (!response.ok)
        throw new Error("Could not download the bundled packages.");
      const bundle = await response.json();
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
