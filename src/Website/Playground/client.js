// Files are the unit of compilation, even while the UI exposes only Main.purs.
export function createCompilerClient({
  createWorker,
  onState,
  onPackages,
  onResult,
  timeout = 30000,
  debounce = 500,
}) {
  let worker;
  let timer;
  let debounceTimer;
  let pending = false;
  let revision = 0;
  let activeRevision;
  let ready = false;
  let files = [];

  function stop() {
    clearTimeout(timer);
    clearTimeout(debounceTimer);
    pending = false;
    worker?.terminate();
    worker = undefined;
    ready = false;
    activeRevision = undefined;
  }

  function fail(message) {
    stop();
    onState({ phase: "failed", message });
  }

  function compile() {
    if (!ready || activeRevision !== undefined) return;
    clearTimeout(debounceTimer);
    pending = false;
    activeRevision = revision;
    onState({ phase: "compiling", message: "Compiling…" });
    timer = setTimeout(
      () =>
        fail("Compilation took too long. Try a smaller example, then retry."),
      timeout,
    );
    worker.postMessage({ type: "compile", id: revision, files });
  }

  function start() {
    stop();
    onState({ phase: "loading", message: "Loading compiler and packages…" });
    timer = setTimeout(
      () => fail("Loading timed out. Check your connection, then retry."),
      timeout * 2,
    );
    try {
      const current = createWorker();
      worker = current;
      current.onmessage = ({ data }) => {
        if (current !== worker) return;
        if (data.type === "progress" && !ready) {
          clearTimeout(timer);
          timer = setTimeout(
            () => fail("Loading timed out. Check your connection, then retry."),
            timeout * 2,
          );
          onState({ phase: "loading", message: data.message });
        } else if (data.type === "ready") {
          clearTimeout(timer);
          ready = true;
          onPackages(data.packages);
          compile();
        } else if (data.type === "result" && data.id === activeRevision) {
          clearTimeout(timer);
          activeRevision = undefined;
          if (data.id !== revision) {
            onState({
              phase: "edited",
              message: "Waiting for edits…",
            });
            if (pending) compile();
            return;
          }
          onResult(data);
          const errors = data.diagnostics.filter(
            ({ severity }) => severity === "error",
          ).length;
          onState({
            phase: errors ? "errors" : "success",
            message: errors
              ? `${errors} ${errors === 1 ? "error" : "errors"}`
              : `Compiled in ${Math.round(data.duration)} ms`,
          });
        } else if (data.type === "failure") {
          fail(`${data.message} Retry to reload the compiler.`);
        }
      };
      current.onerror = () => {
        if (current === worker)
          fail("The compiler worker stopped. Retry to reload it.");
      };
      current.onmessageerror = () => {
        if (current === worker)
          fail("The compiler response could not be read. Retry to reload it.");
      };
      current.postMessage({ type: "initialize" });
    } catch {
      fail(
        "The compiler worker could not start. Retry in a browser with WebAssembly support.",
      );
    }
  }

  return {
    start,
    compile,
    dispose: stop,
    updateFiles(nextFiles) {
      files = nextFiles;
      revision += 1;
      clearTimeout(debounceTimer);
      pending = false;
      debounceTimer = setTimeout(() => {
        pending = true;
        compile();
      }, debounce);
      if (ready && activeRevision === undefined) {
        onState({
          phase: "edited",
          message: "Waiting for edits…",
        });
      }
    },
    cancel() {
      stop();
      onState({
        phase: "failed",
        message: "Compilation cancelled. Retry when you’re ready.",
      });
    },
  };
}
