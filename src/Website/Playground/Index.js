import { createCompilerClient } from "../../src/Website/Playground/client.js";
import { examples } from "../../src/Website/Playground/examples.js";

// Browser resources are created by a PureScript useEffect and disposed by its cleanup.
export const initializeEditor = (bindings) => () => {
  let disposed = false;
  let editors;
  let client;
  if (/Mac/.test(navigator.platform))
    document.documentElement.setAttribute("data-landing-macos", "");
  import("../../src/Website/Playground/editor.js")
    .then(({ createEditors }) => {
      if (disposed) return;
      client = createCompilerClient({
        createWorker: () => new Worker(
          new URL("../../src/Website/Playground/compiler.worker.js", import.meta.url),
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

export const syncPackageDialog = (open) => (ref) => () => {
  const dialog = ref.current;
  if (!open && !dialog.open) return () => {};
  const current = getComputedStyle(dialog);
  const from = dialog.open
    ? { transform: current.transform, opacity: current.opacity }
    : { transform: "translateX(100%)", opacity: 1 };
  const backdropOpacity = dialog.open ? getComputedStyle(dialog, "::backdrop").opacity : 0;
  dialog.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
  if (open) dialog.showModal();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    if (!open) dialog.close();
    return () => {};
  }
  const timing = { duration: open ? 300 : 180, easing: "cubic-bezier(0.2, 0, 0, 1)", fill: "both" };
  const panel = dialog.animate([from, open
    ? { transform: "translateX(0)", opacity: 1 }
    : { transform: "translateX(24px)", opacity: 0 }], timing);
  const backdrop = dialog.animate(
    [{ opacity: backdropOpacity }, { opacity: open ? 1 : 0 }],
    { ...timing, pseudoElement: "::backdrop" },
  );
  panel.onfinish = () => {
    if (!open) dialog.close();
    panel.cancel();
    backdrop.cancel();
  };
  return () => {
    // Preserve the current frame if opening is interrupted by dismissal.
    if (panel.playState === "running") panel.pause();
    if (backdrop.playState === "running") backdrop.pause();
  };
};

export const syncLicenseDialog = (open) => (ref) => () => {
  const dialog = ref.current;
  const animations = [];
  if (open && !dialog.open) {
    dialog.returnFocusTo = document.activeElement;
    dialog.showModal();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timing = { duration: 220, easing: "cubic-bezier(0.2, 0, 0, 1)" };
      animations.push(dialog.animate([
        { opacity: 0, transform: "translateY(12px)" },
        { opacity: 1, transform: "translateY(0)" },
      ], timing));
      animations.push(dialog.animate([{ opacity: 0 }, { opacity: 1 }], {
        ...timing, pseudoElement: "::backdrop",
      }));
    }
  } else if (!open && dialog.open) {
    dialog.close();
    dialog.returnFocusTo?.focus({ preventScroll: true });
    delete dialog.returnFocusTo;
  }
  return () => animations.forEach(animation => animation.cancel());
};

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
