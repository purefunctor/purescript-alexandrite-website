import { createElement as h, StrictMode, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { createDialogAnimation } from "../../src/Website/Playground/dialog.js";

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const settle = async () => {
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);
};
const animate = Element.prototype.animate;
Element.prototype.animate = function (...args) {
  const animation = animate.apply(this, args);
  if (this.tagName === "DIALOG") animation.pause();
  return animation;
};

const frame = dialog => {
  const style = getComputedStyle(dialog);
  return [...new DOMMatrixReadOnly(style.transform).toFloat64Array(),
    Number(style.opacity), Number(getComputedStyle(dialog, "::backdrop").opacity)];
};
const seek = (dialog, fraction) => {
  for (const animation of dialog.getAnimations({ subtree: true })) {
    animation.currentTime = Number(animation.effect.getTiming().duration) * fraction;
  }
};
const finish = async dialog => {
  dialog.getAnimations({ subtree: true }).forEach(animation => animation.finish());
  await settle();
  assert(dialog.getAnimations({ subtree: true }).length === 0, "Completed animations were not removed");
  assert(dialog.style.transform === "none" && dialog.style.opacity === "1", "Authored styles were not restored");
};

const fixture = (kind, initialOpen = false) => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let controller;
  function Dialog({ open }) {
    const ref = useRef();
    const resource = useRef();
    useEffect(() => {
      const animation = createDialogAnimation(ref.current, kind);
      controller = resource.current = animation;
      return () => animation.dispose();
    }, []);
    useEffect(() => {
      resource.current.setOpen(open);
      if (open) ref.current.querySelector("button").focus();
    }, [open]);
    return h("dialog", { ref, style: { transform: "none", opacity: 1 } },
      h("button", null, "Close"), h("p", null, "Retained content"));
  }
  const setOpen = open => flushSync(() => root.render(h(StrictMode, null, h(Dialog, { open }))));
  setOpen(initialOpen);
  const dialog = host.querySelector("dialog");
  return { dialog, setOpen, controller: () => controller, unmount: () => {
    flushSync(() => root.unmount());
    host.remove();
  } };
};

async function run() {
  const opener = document.querySelector("#opener");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let checks = 0;
  for (const kind of ["license", "packages"]) {
    const test = fixture(kind);
    const { dialog, setOpen } = test;
    opener.focus();
    setOpen(true);
    assert(dialog.matches(":modal"), `${kind}: not in the top layer`);
    if (reduced) {
      assert(dialog.getAnimations({ subtree: true }).length === 0, "Reduced-motion entry animated");
      setOpen(false);
      assert(!dialog.open && dialog.getAnimations({ subtree: true }).length === 0, "Reduced-motion exit was delayed");
      assert(document.activeElement === opener, "Reduced-motion focus restoration failed");
      test.unmount();
      checks++;
      continue;
    }
    assert(dialog.getAnimations({ subtree: true }).length === 3, "Expected two panel properties and one backdrop animation");
    assert(dialog.getAnimations({ subtree: true }).every(a => a.effect.getTiming().duration === (kind === "license" ? 220 : 300)), "Entry duration changed");

    // Prove continuity in both directions, away from the initial/end frames.
    for (const open of [false, true]) {
      seek(dialog, 0.37);
      const before = frame(dialog);
      const previous = dialog.getAnimations({ subtree: true });
      setOpen(open);
      seek(dialog, 0);
      const after = frame(dialog);
      assert(before.every((value, i) => Math.abs(value - after[i]) < 0.001), `${kind}: reversal jumped: ${before} -> ${after}`);
      assert(previous.every(a => a.playState === "idle"), "Replaced effects were not cancelled");
      assert(dialog.matches(":modal") && dialog.textContent.includes("Retained content"), "Reversal lost modality/content");
      checks++;
    }
    await finish(dialog);
    setOpen(false);
    assert(dialog.getAnimations({ subtree: true }).every(a => a.effect.getTiming().duration === (kind === "license" ? 160 : 180)), "Exit duration changed");

    // Resolve an obsolete exit, then reopen before its promise callbacks execute.
    dialog.getAnimations({ subtree: true }).forEach(animation => animation.onfinish());
    setOpen(true);
    await settle();
    assert(dialog.matches(":modal") && dialog.getAnimations({ subtree: true }).length === 3, "Stale exit closed the reopened dialog");
    await finish(dialog);
    setOpen(false);
    await finish(dialog);
    assert(!dialog.open && document.activeElement === opener, "Normal close/focus restoration failed");
    checks++;
    test.unmount();

    for (const exiting of [false, true]) {
      const mounted = fixture(kind);
      opener.focus();
      mounted.setOpen(true);
      if (exiting) {
        await finish(mounted.dialog);
        mounted.setOpen(false);
      }
      seek(mounted.dialog, 0.4);
      const handles = mounted.dialog.getAnimations({ subtree: true });
      const resource = mounted.controller();
      let focusCalls = 0;
      const focus = opener.focus;
      opener.focus = () => { focusCalls++; };
      mounted.unmount();
      await settle();
      assert(handles.every(a => a.playState === "idle"), "React unmount left animation handles alive");
      assert(mounted.dialog.style.transform === "none" && mounted.dialog.style.opacity === "1", "Unmount left Motion inline styles");
      resource.setOpen(true);
      assert(!mounted.dialog.open && focusCalls === 0, "Disposed controller reopened or restored focus");
      opener.focus = focus;
      checks++;
    }

    opener.focus();
    const replayed = fixture(kind, true);
    assert(replayed.dialog.matches(":modal") && replayed.dialog.getAnimations({ subtree: true }).length === 3, "StrictMode replay left duplicate animations or closed the dialog");
    await finish(replayed.dialog);
    replayed.setOpen(false);
    await finish(replayed.dialog);
    assert(document.activeElement === opener, "StrictMode replay lost the opener");
    replayed.unmount();
    checks++;

    // Cancel only owned animations and preserve inline declaration priorities.
    const standalone = document.createElement("dialog");
    standalone.style.setProperty("opacity", "1", "important");
    standalone.style.setProperty("transform", "none", "important");
    document.body.append(standalone);
    const resource = createDialogAnimation(standalone, kind);
    resource.setOpen(true);
    const unrelated = animate.call(standalone, { color: ["red", "blue"] }, { duration: 10000 });
    unrelated.pause();
    resource.setOpen(false);
    resource.dispose();
    assert(unrelated.playState === "paused", "Controller cancelled an animation it does not own");
    assert(standalone.style.getPropertyPriority("opacity") === "important" && standalone.style.getPropertyPriority("transform") === "important", "Inline priorities lost");
    unrelated.cancel();
    standalone.remove();
    checks++;
  }
  return { checks, reduced };
}

run().then(result => { window.testResult = result; }, error => {
  window.testResult = { error: error.stack };
});
