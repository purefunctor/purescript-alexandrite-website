import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as stylex from "@stylexjs/stylex";
import LoaderIcon from "~icons/lucide/loader-circle";
import { prepareExecution } from "../../src/Playground/runtime.js";

const spin = stylex.keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

const styles = stylex.create({
  panel: { height: "100%", display: "flex", flexDirection: "column" },
  progress: {
    minWidth: 56,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: 18,
    height: 18,
    color: "var(--landing-color-ink)",
    animationName: spin,
    animationDuration: "800ms",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
    animationPlayState: {
      default: "running",
      "@media (prefers-reduced-motion: reduce)": "paused",
    },
  },
  button: {
    backgroundColor: {
      default: "var(--playground-color-action)",
      ":hover": "var(--playground-color-action-hover)",
    },
    borderRadius: 999,
    paddingInline: 10,
    minHeight: 32,
    fontSize: 12,
    cursor: "var(--landing-interactive-cursor, pointer)",
    ":focus-visible": {
      outline: "2px solid var(--landing-color-crystal)",
      outlineOffset: 2,
    },
    ":disabled": { opacity: 0.5, cursor: "default" },
  },
  message: {
    fontSize: 12,
    padding: 12,
    overflowWrap: "anywhere",
    color: "var(--landing-color-muted)",
  },
  frame: { borderWidth: 0, width: "100%", flexGrow: 1, minHeight: 0 },
});

export function Result({ outputs, phase, toolbar }) {
  const iframe = useRef(null);
  const generation = useRef(0);
  const [run, setRun] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [message, setMessage] = useState("");
  const progress = ["loading", "edited", "compiling"].includes(phase)
    ? phase === "loading"
      ? "Loading compiler"
      : "Compiling"
    : preparing
      ? "Preparing runtime"
      : executing
        ? "Running program"
        : null;

  useEffect(() => {
    generation.current++;
    setRun(null);
    setPreparing(false);
    setExecuting(false);
    setMessage("");
    if (outputs) start();
    return () => {
      generation.current++;
    };
  }, [outputs]);

  useEffect(() => {
    if (!run) return;
    const timer = setTimeout(() => {
      setRun(null);
      setExecuting(false);
      setMessage("Execution timed out.");
    }, 15000);
    const receive = (event) => {
      if (
        event.source !== iframe.current?.contentWindow ||
        event.origin !== "null" ||
        event.data?.type !== "execution" ||
        event.data.id !== run.id
      )
        return;
      clearTimeout(timer);
      setExecuting(false);
      setMessage(
        event.data.phase === "success"
          ? ""
          : String(event.data.message).slice(0, 2000),
      );
    };
    window.addEventListener("message", receive);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("message", receive);
    };
  }, [run]);

  async function start() {
    const id = ++generation.current;
    setRun(null);
    setPreparing(true);
    setExecuting(false);
    setMessage("");
    try {
      const response = await fetch("/playground/runtime.json", {
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok)
        throw new Error(
          "The bundled runtime could not load. Try running again.",
        );
      const execution = await prepareExecution(outputs, await response.json());
      if (generation.current !== id) return;
      setRun({ ...execution, id });
      setExecuting(true);
    } catch (error) {
      if (generation.current === id)
        setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      if (generation.current === id) setPreparing(false);
    }
  }

  return (
    <div
      data-runtime-ready={Boolean(run && !executing && !message)}
      {...stylex.props(styles.panel)}
    >
      {(message || phase === "errors") && (
        <p role="status" {...stylex.props(styles.message)}>
          {phase === "errors" ? "Compilation failed" : message}
        </p>
      )}
      {toolbar &&
        createPortal(
          <>
            {progress ? (
              <div
                role="status"
                aria-label={progress}
                {...stylex.props(styles.progress)}
              >
                <LoaderIcon
                  aria-hidden="true"
                  {...stylex.props(styles.spinner)}
                />
              </div>
            ) : (
              <button
                type="button"
                {...stylex.props(styles.button)}
                disabled={!outputs || preparing}
                onClick={start}
              >
                Restart
              </button>
            )}
            {run && (
              <button
                type="button"
                {...stylex.props(styles.button)}
                onClick={() => {
                  generation.current++;
                  setRun(null);
                  setExecuting(false);
                  setMessage("Program stopped.");
                }}
              >
                Stop
              </button>
            )}
          </>,
          toolbar,
        )}
      {run && (
        <iframe
          key={run.id}
          ref={iframe}
          title="JavaScript result"
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          src="/playground-sandbox.html"
          {...stylex.props(styles.frame)}
          onLoad={() => {
            const colors = getComputedStyle(document.documentElement);
            iframe.current?.contentWindow.postMessage(
              {
                type: "execute",
                ...run,
                colors: {
                  background: colors
                    .getPropertyValue("--landing-color-surface")
                    .trim(),
                  foreground: colors
                    .getPropertyValue("--landing-color-ink")
                    .trim(),
                },
              },
              "*",
            );
          }}
        />
      )}
    </div>
  );
}
