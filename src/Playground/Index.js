import { createCompilerClient } from "../../src/Playground/client.js";
import { examples } from "../../src/Playground/examples.js";

export { examples };

// Browser resources are created by a PureScript useEffect and disposed by its cleanup.
export const initializeEditor = (bindings) => () => {
  let disposed = false;
  let editors;
  let client;
  if (/Mac/.test(navigator.platform))
    document.documentElement.setAttribute("data-landing-macos", "");
  import("../../src/Playground/editor.js")
    .then(({ createEditors }) => {
      if (disposed) return;
      client = createCompilerClient({
        createWorker: () => new Worker(
          new URL("../../src/Playground/compiler.worker.js", import.meta.url),
          { type: "module" },
        ),
        onState: (state) => bindings.onState(state)(),
        onPackages: (packages) => bindings.onPackages(packages)(),
        onResult: (result) => {
          const hasErrors = result.diagnostics.some(({ severity }) => severity === "error");
          editors.setOutput(hasErrors ? "" : (result.outputs[0]?.source ?? ""));
          editors.setDiagnostics(result.diagnostics);
          bindings.onDiagnostics(result.diagnostics)();
          bindings.onOutputs(hasErrors ? null : result.outputs)();
        },
      });
      editors = createEditors(
        bindings.source.current,
        bindings.output.current,
        examples[0].source,
        (source) => {
          editors.setOutput("");
          editors.setDiagnostics([]);
          bindings.onDiagnostics([])();
          bindings.onOutputs(null)();
          client.updateFiles([
            { path: "Main.purs", source },
            ...(examples[bindings.session.current.exampleIndex].files ?? []),
          ]);
        },
      );
      bindings.session.current = { client, editors, exampleIndex: 0 };
      client.updateFiles([{ path: "Main.purs", source: examples[0].source }]);
      client.start();
    })
    .catch(() => {
      if (!disposed) bindings.onState({
        phase: "editor-failed",
        message: "Editor unavailable. Reload to retry.",
      })();
    });
  return () => {
    disposed = true;
    client?.dispose();
    editors?.dispose();
    bindings.session.current = null;
  };
};

export const retryCompiler = (session) => () => session.current?.client.start();

export const selectExample = (session) => (selected) => (event) => {
  const index = Number(event.target.value);
  session.current.exampleIndex = index;
  selected(index)();
  session.current.editors.setSource(examples[index].source);
};

export const focusElement = (preventScroll) => (ref) => () =>
  ref.current?.focus({ preventScroll });

export const onEscape = (close) => (event) => {
  if (event.key === "Escape") close();
};

export const tabKeyDown = (name) => (selected) => (event) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const next = event.key === "Home" ? "javascript"
    : event.key === "End" ? "result"
    : name === "javascript" ? "result" : "javascript";
  selected(next)();
  document.getElementById(`tab-${next}`).focus();
};
