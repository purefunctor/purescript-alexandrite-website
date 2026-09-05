import { animate } from "motion/mini";

const transitions = {
  packages: {
    enter: { transform: "translateX(100%)", opacity: 1 },
    visible: { transform: "translateX(0)", opacity: 1 },
    exit: { transform: "translateX(24px)", opacity: 0 },
    duration: { enter: 0.3, exit: 0.18 },
  },
  license: {
    enter: { transform: "scale(0.96)", opacity: 0 },
    visible: { transform: "scale(1)", opacity: 1 },
    exit: { transform: "scale(0.96)", opacity: 0 },
    duration: { enter: 0.22, exit: 0.16 },
  },
};

// Browser resources only: PureScript owns requested visibility and retained content.
export const createDialogAnimation = (dialog, kind) => {
  const transition = transitions[kind];
  const originalStyles = ["transform", "opacity"].map(name => [
    name, dialog.style.getPropertyValue(name), dialog.style.getPropertyPriority(name),
  ]);
  let active;
  let disposed = false;
  let returnFocusTo;

  const cancel = () => {
    const previous = active;
    active = undefined; // Invalidate completion before cancelling its effects.
    previous?.panel.cancel();
    // Mini's stop() neither cancels nor commits pseudo-element animations.
    previous?.backdrop.cancel();
    for (const [name, value, priority] of originalStyles) {
      if (value) dialog.style.setProperty(name, value, priority);
      else dialog.style.removeProperty(name);
    }
  };

  const close = () => {
    dialog.close();
    if (returnFocusTo?.isConnected) returnFocusTo.focus({ preventScroll: true });
    returnFocusTo = undefined;
  };

  return {
    setOpen(open) {
      if (disposed || (!open && !dialog.open)) return;
      // Materialize values before cancellation; getComputedStyle is a live object.
      const current = getComputedStyle(dialog);
      const from = dialog.open
        ? { transform: current.transform, opacity: current.opacity }
        : transition.enter;
      const backdropOpacity = dialog.open ? getComputedStyle(dialog, "::backdrop").opacity : 0;
      cancel();
      if (open && !dialog.open) {
        returnFocusTo = document.activeElement;
        dialog.showModal();
      }
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        if (!open) close();
        return;
      }
      const to = open ? transition.visible : transition.exit;
      const timing = {
        duration: open ? transition.duration.enter : transition.duration.exit,
        ease: [0.2, 0, 0, 1],
      };
      const run = {
        panel: animate(dialog, {
          transform: [from.transform, to.transform], opacity: [from.opacity, to.opacity],
        }, timing),
        backdrop: animate(dialog, { opacity: [backdropOpacity, open ? 1 : 0] }, {
          ...timing, pseudoElement: "::backdrop",
        }),
      };
      active = run;
      Promise.all([run.panel, run.backdrop]).then(() => {
        if (active !== run) return;
        if (!open) close();
        cancel(); // Also restore the final inline values written by Motion Mini.
      });
    },
    dispose() {
      disposed = true;
      cancel();
      returnFocusTo = undefined;
      // React effect replay can dispose while the dialog is still connected.
      if (dialog.open) dialog.close();
    },
  };
};
