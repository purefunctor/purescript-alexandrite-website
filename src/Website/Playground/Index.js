import { createCompilerClient } from "#src/Website/Playground/client.js";
import { createDialogAnimation } from "#src/Website/Playground/dialog.js";
import { examples } from "#src/Website/Playground/examples.js";

// Browser resources are created by a PureScript useEffect and disposed by its cleanup.
export const initializeEditor = (bindings) => () => {
  let disposed = false;
  let editors;
  let client;
  if (/Mac/.test(navigator.platform))
    document.documentElement.setAttribute("data-landing-macos", "");
  import("#src/Website/Playground/editor.js")
    .then(({ createEditors }) => {
      if (disposed) return;
      client = createCompilerClient({
        createWorker: () => new Worker(
          new URL("#src/Website/Playground/compiler.worker.js", import.meta.url),
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

export const selectExample = (session) => (selected) => (index) => () => {
  session.current.exampleIndex = index;
  selected(index)();
  session.current.editors.setSource(examples[index].source);
};

export const focusElement = (preventScroll) => (ref) => () =>
  ref.current?.focus({ preventScroll });

export const observePackageScroll = (ref) => () => {
  const list = ref.current;
  const update = () => {
    const remaining = list.scrollHeight - list.clientHeight - list.scrollTop;
    const opacity = (distance) => String(1 - Math.min(1, Math.max(0, distance) / 40));
    list.style.setProperty("--package-top-opacity", opacity(list.scrollTop));
    list.style.setProperty("--package-bottom-opacity", opacity(remaining));
  };
  const observer = new ResizeObserver(update);
  observer.observe(list);
  list.addEventListener("scroll", update, { passive: true });
  update();
  return () => {
    observer.disconnect();
    list.removeEventListener("scroll", update);
  };
};

export const initializeDialogs = ({ packages, license, session }) => () => {
  const controllers = {
    packages: createDialogAnimation(packages.current, "packages"),
    license: createDialogAnimation(license.current, "license"),
  };
  session.current = controllers;
  return () => {
    controllers.license.dispose();
    controllers.packages.dispose();
    session.current = null;
  };
};

export const syncPackageDialog = (open) => (session) => () => session.current.packages.setOpen(open);
export const syncLicenseDialog = (open) => (session) => () => session.current.license.setOpen(open);

export const cancelPackageDialog = (close) => (event) => {
  event.preventDefault();
  close();
};

export const dismissPackageBackdrop = (close) => (event) => {
  if (event.target !== event.currentTarget) return;
  const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
  if (event.clientX < left || event.clientX > right ||
      event.clientY < top || event.clientY > bottom) close();
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
