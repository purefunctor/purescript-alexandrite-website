import { createPortal } from "react-dom";
import LoaderIcon from "~icons/lucide/loader-circle";
import { prepareExecution } from "#src/Website/Playground/runtime.js";
import assets from "#build/playground-assets.json";

export const loaderIcon = LoaderIcon;
export const portal = (toolbar) => (children) => toolbar ? createPortal(children, toolbar) : null;

export const prepareRuntime = (bindings) => () => {
  const id = ++bindings.generation.current;
  bindings.onRun(null)();
  bindings.onPreparing(true)();
  bindings.onExecuting(false)();
  bindings.onMessage("")();
  void (async () => {
    try {
      const response = await fetch(assets.runtime, {
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok)
        throw new Error("The bundled runtime could not load. Try running again.");
      const execution = await prepareExecution(bindings.outputs, await response.json());
      if (bindings.generation.current !== id) return;
      bindings.onRun({ ...execution, id })();
      bindings.onExecuting(true)();
    } catch (error) {
      if (bindings.generation.current === id)
        bindings.onMessage(error instanceof Error ? error.message : String(error))();
    } finally {
      if (bindings.generation.current === id) bindings.onPreparing(false)();
    }
  })();
};

export const observeExecution = (bindings) => () => {
  const timer = setTimeout(() => {
    bindings.onRun(null)();
    bindings.onExecuting(false)();
    bindings.onMessage("Execution timed out.")();
  }, 15000);
  const receive = (event) => {
    if (
      event.source !== bindings.iframe.current?.contentWindow ||
      event.origin !== "null" ||
      event.data?.type !== "execution" ||
      event.data.id !== bindings.run.id
    ) return;
    clearTimeout(timer);
    bindings.onExecuting(false)();
    bindings.onMessage(
      event.data.phase === "success" ? "" : String(event.data.message).slice(0, 2000),
    )();
  };
  window.addEventListener("message", receive);
  return () => {
    clearTimeout(timer);
    window.removeEventListener("message", receive);
  };
};

export const executeFrame = (iframe) => (run) => () => {
  const colors = getComputedStyle(document.documentElement);
  iframe.current?.contentWindow.postMessage(
    {
      type: "execute",
      ...run,
      colors: {
        background: colors.getPropertyValue("--landing-color-surface").trim(),
        foreground: colors.getPropertyValue("--landing-color-ink").trim(),
      },
    },
    "*",
  );
};
