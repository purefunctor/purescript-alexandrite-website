import { useEffect, useRef, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { createCompilerClient } from "../../src/Playground/client.js";
import { Result } from "../../src/Playground/Result.jsx";
import { examples } from "../../src/Playground/examples.js";

const styles = stylex.create({
  page: {
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    backgroundColor: "var(--landing-color-purescript-charcoal)",
    color: "var(--landing-color-paper)",
    paddingBlock: 8,
    paddingInline: 16,
    display: "flex",
    flexWrap: "wrap",
    gap: "8px 24px",
    alignItems: "center",
    flexShrink: 0,
  },
  title: { fontSize: 16, fontWeight: 550, whiteSpace: "nowrap" },
  brand: {
    color: "inherit",
    textDecoration: "none",
    fontFamily: "Oxanium Variable, sans-serif",
    fontSize: 18,
    fontWeight: 200,
    letterSpacing: "0.055em",
    lineHeight: 1,
  },
  tools: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginInlineStart: "auto",
  },
  button: {
    backgroundColor: {
      default: "var(--landing-color-white-translucent)",
      ":hover": "var(--playground-color-dark-action-hover)",
    },
    color: "inherit",
    paddingInline: 12,
    minHeight: 32,
    borderRadius: 999,
    fontSize: 12,
    cursor: "var(--landing-interactive-cursor, pointer)",
    ":focus-visible": {
      outline: "2px solid var(--landing-color-signal)",
      outlineOffset: 2,
    },
  },
  status: {
    fontSize: 12,
    color: "var(--landing-color-signal)",
    overflowWrap: "anywhere",
  },
  errorStatus: { color: "var(--landing-color-paper)" },
  skip: {
    position: "absolute",
    insetInlineStart: 16,
    top: { default: -100, ":focus": 8 },
    zIndex: 10,
    backgroundColor: "var(--landing-color-signal)",
    padding: 12,
  },
  main: { display: "flex", flex: 1, minHeight: 0, position: "relative" },
  sidebar: {
    width: 280,
    maxWidth: "85vw",
    flexShrink: 0,
    overflowY: "auto",
    padding: 16,
    backgroundColor: "var(--landing-color-paper)",
    position: "absolute",
    insetBlock: 0,
    insetInlineEnd: 0,
    zIndex: 5,
    transform: "translateX(100%)",
    visibility: "hidden",
    transitionProperty: "transform, visibility",
    transitionDuration: {
      default: "220ms",
      "@media (prefers-reduced-motion: reduce)": "0ms",
    },
    transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
    transitionDelay: {
      default: "0ms, 220ms",
      "@media (prefers-reduced-motion: reduce)": "0ms",
    },
  },
  sidebarOpen: {
    transform: "translateX(0)",
    visibility: "visible",
    transitionDelay: "0ms",
  },
  sidebarHeading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 16,
  },
  close: {
    backgroundColor: {
      default: "var(--playground-color-action)",
      ":hover": "var(--playground-color-action-hover)",
    },
  },
  packageNote: {
    fontSize: 12,
    color: "var(--landing-color-muted)",
    marginBottom: 16,
  },
  packages: { listStyleType: "none", padding: 0, fontSize: 12 },
  package: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    paddingBlock: 5,
  },
  version: {
    color: "var(--landing-color-muted)",
    fontVariantNumeric: "tabular-nums",
  },
  panes: {
    display: "grid",
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    gridTemplateColumns: {
      default: "minmax(0, 1fr) minmax(0, 1fr)",
      "@media (max-width: 800px)": "minmax(0, 1fr)",
    },
    gridTemplateRows: {
      default: "minmax(0, 1fr)",
      "@media (max-width: 800px)": "minmax(0, 1fr) minmax(0, 1fr)",
    },
    gap: 1,
    backgroundColor: "var(--landing-color-paper)",
  },
  pane: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    minHeight: 0,
    backgroundColor: "var(--landing-color-surface)",
  },
  toolbar: {
    backgroundColor: "var(--landing-color-paper)",
    paddingInline: 12,
    minHeight: 44,
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexShrink: 0,
  },
  runtimeActions: {
    display: "flex",
    gap: 4,
    marginInlineStart: "auto",
    flexShrink: 0,
  },
  paneTitle: { fontSize: 12, fontWeight: 550 },
  select: {
    fontFamily: "inherit",
    fontSize: 12,
    minHeight: 32,
    maxWidth: "100%",
    paddingInline: 12,
    borderWidth: 0,
    borderRadius: 999,
    backgroundColor: "var(--playground-color-action)",
    color: "var(--landing-color-ink)",
    cursor: "var(--landing-interactive-cursor, pointer)",
    ":focus-visible": {
      outline: "2px solid var(--landing-color-crystal)",
      outlineOffset: 2,
    },
  },
  tabs: { display: "flex", gap: 4 },
  tab: {
    backgroundColor: {
      default: "var(--playground-color-action)",
      ":hover": "var(--playground-color-action-hover)",
    },
    paddingInline: 12,
    minHeight: 32,
    fontSize: 12,
    borderRadius: 999,
    cursor: "var(--landing-interactive-cursor, pointer)",
    ":focus-visible": {
      outline: "2px solid var(--landing-color-crystal)",
      outlineOffset: 2,
    },
  },
  selectedTab: {
    backgroundColor: "var(--landing-color-ink)",
    color: "var(--landing-color-paper)",
  },
  editor: { flex: 1, minHeight: 0, minWidth: 0, overflow: "hidden" },
  diagnostics: {
    maxHeight: "35%",
    flexShrink: 0,
    overflowY: "auto",
    padding: 12,
    backgroundColor: "var(--landing-color-paper)",
  },
  diagnosticList: { paddingInlineStart: 20, fontSize: 12 },
  diagnostic: {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    paddingBlock: 4,
    fontFamily: "JetBrains Mono Variable, monospace",
  },
});

export function component() {
  const sourceElement = useRef(null);
  const outputElement = useRef(null);
  const controller = useRef(null);
  const editorController = useRef(null);
  const selectedExample = useRef(0);
  const [exampleIndex, setExampleIndex] = useState(0);
  const packageButton = useRef(null);
  const packageCloseButton = useRef(null);
  const [state, setState] = useState({
    phase: "loading",
    message: "Loading editor…",
  });
  const [packages, setPackages] = useState([]);
  const [showPackages, setShowPackages] = useState(false);
  const [diagnostics, setDiagnostics] = useState([]);
  const [outputs, setOutputs] = useState(null);
  const [tab, setTab] = useState("result");
  const [runtimeToolbar, setRuntimeToolbar] = useState(null);

  useEffect(() => {
    if (showPackages) packageCloseButton.current?.focus({ preventScroll: true });
  }, [showPackages]);

  useEffect(() => {
    let disposed = false;
    let editors;
    let client;
    if (/Mac/.test(navigator.platform))
      document.documentElement.setAttribute("data-landing-macos", "");
    import("../../src/Playground/editor.js")
      .then(({ createEditors }) => {
        if (disposed) return;
        client = createCompilerClient({
          createWorker: () =>
            new Worker(
              new URL(
                "../../src/Playground/compiler.worker.js",
                import.meta.url,
              ),
              { type: "module" },
            ),
          onState: setState,
          onPackages: setPackages,
          onResult: (result) => {
            const hasErrors = result.diagnostics.some(
              ({ severity }) => severity === "error",
            );
            editors.setOutput(
              hasErrors ? "" : (result.outputs[0]?.source ?? ""),
            );
            editors.setDiagnostics(result.diagnostics);
            setDiagnostics(result.diagnostics);
            setOutputs(hasErrors ? null : result.outputs);
          },
        });
        controller.current = client;
        editors = createEditors(
          sourceElement.current,
          outputElement.current,
          examples[0].source,
          (source) => {
            editors.setOutput("");
            editors.setDiagnostics([]);
            setDiagnostics([]);
            setOutputs(null);
            client.updateFiles([
              { path: "Main.purs", source },
              ...(examples[selectedExample.current].files ?? []),
            ]);
          },
        );
        editorController.current = editors;
        client.updateFiles([{ path: "Main.purs", source: examples[0].source }]);
        client.start();
      })
      .catch(() => {
        if (!disposed)
          setState({
            phase: "editor-failed",
            message: "Editor unavailable. Reload to retry.",
          });
      });
    return () => {
      disposed = true;
      client?.dispose();
      editors?.dispose();
      controller.current = null;
      editorController.current = null;
    };
  }, []);

  function closePackages() {
    setShowPackages(false);
    packageButton.current?.focus();
  }

  return (
    <div {...stylex.props(styles.page)}>
      <a href="#playground" {...stylex.props(styles.skip)}>
        Skip to playground
      </a>
      <header {...stylex.props(styles.header)}>
        <h1 {...stylex.props(styles.title)}>
          <a href="/" {...stylex.props(styles.brand)}>
            ALEXANDRITE
          </a>{" "}
          playground
        </h1>
        <p
          id="compile-status"
          role="status"
          aria-live="polite"
          hidden={["loading", "edited", "compiling"].includes(state.phase)}
          {...stylex.props(
            styles.status,
            ["failed", "editor-failed", "errors"].includes(state.phase) &&
              styles.errorStatus,
          )}
        >
          {state.message}
        </p>
        <div {...stylex.props(styles.tools)}>
          {state.phase === "failed" && (
            <button
              type="button"
              {...stylex.props(styles.button)}
              onClick={() => controller.current?.start()}
            >
              Retry compiler
            </button>
          )}
          <button
            ref={packageButton}
            type="button"
            aria-expanded={showPackages}
            aria-controls="package-list"
            {...stylex.props(styles.button)}
            onClick={() => setShowPackages(!showPackages)}
          >
            Packages{packages.length ? ` (${packages.length})` : ""}
          </button>
        </div>
      </header>
      <main id="playground" {...stylex.props(styles.main)}>
        <aside
          id="package-list"
          aria-label="Bundled packages"
          aria-hidden={!showPackages}
          inert={showPackages ? undefined : ""}
          {...stylex.props(styles.sidebar, showPackages && styles.sidebarOpen)}
          onKeyDown={(event) => {
            if (event.key === "Escape") closePackages();
          }}
        >
          <div {...stylex.props(styles.sidebarHeading)}>
            <h2 {...stylex.props(styles.paneTitle)}>Packages · 80.8.1</h2>
            <button
              ref={packageCloseButton}
              type="button"
              {...stylex.props(styles.button, styles.close)}
              onClick={closePackages}
            >
              Close
            </button>
          </div>
          <p {...stylex.props(styles.packageNote)}>
            Available to import. Core, React Basic, React Basic Hooks, Halogen
            and dependencies.
          </p>
          <ul {...stylex.props(styles.packages)}>
            {packages.map(({ name, version }) => (
              <li key={name} {...stylex.props(styles.package)}>
                <span>{name}</span>
                <span {...stylex.props(styles.version)}>{version}</span>
              </li>
            ))}
          </ul>
        </aside>
        <div {...stylex.props(styles.panes)}>
          <section aria-label="Source" {...stylex.props(styles.pane)}>
            <div {...stylex.props(styles.toolbar)}>
              <select
                aria-label="Example"
                value={exampleIndex}
                disabled={
                  state.phase === "loading" || state.phase === "editor-failed"
                }
                {...stylex.props(styles.select)}
                onChange={(event) => {
                  const index = Number(event.target.value);
                  selectedExample.current = index;
                  setExampleIndex(index);
                  editorController.current?.setSource(examples[index].source);
                }}
              >
                {examples.map((example, index) => (
                  <option key={example.name} value={index}>
                    {example.name}
                  </option>
                ))}
              </select>
            </div>
            <div ref={sourceElement} {...stylex.props(styles.editor)} />
            {diagnostics.length > 0 && (
              <section
                aria-label="Diagnostics"
                {...stylex.props(styles.diagnostics)}
              >
                <ul {...stylex.props(styles.diagnosticList)}>
                  {diagnostics.map((diagnostic, index) => (
                    <li key={index} {...stylex.props(styles.diagnostic)}>
                      {diagnostic.path}: {diagnostic.severity} —{" "}
                      {diagnostic.message}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </section>
          <section aria-label="Output" {...stylex.props(styles.pane)}>
            <div {...stylex.props(styles.toolbar)}>
              <div
                role="tablist"
                aria-label="Output view"
                {...stylex.props(styles.tabs)}
              >
                {["javascript", "result"].map((name) => (
                  <button
                    key={name}
                    type="button"
                    role="tab"
                    id={`tab-${name}`}
                    aria-controls={`panel-${name}`}
                    aria-selected={tab === name}
                    tabIndex={tab === name ? 0 : -1}
                    {...stylex.props(
                      styles.tab,
                      tab === name && styles.selectedTab,
                    )}
                    onClick={() => setTab(name)}
                    onKeyDown={(event) => {
                      if (
                        !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                          event.key,
                        )
                      )
                        return;
                      event.preventDefault();
                      const next =
                        event.key === "Home"
                          ? "javascript"
                          : event.key === "End"
                            ? "result"
                            : name === "javascript"
                              ? "result"
                              : "javascript";
                      setTab(next);
                      document.getElementById(`tab-${next}`).focus();
                    }}
                  >
                    {name === "javascript" ? "JavaScript" : "Runtime"}
                  </button>
                ))}
              </div>
              <div
                ref={setRuntimeToolbar}
                {...stylex.props(styles.runtimeActions)}
              />
            </div>
            <div
              id="panel-javascript"
              role="tabpanel"
              aria-labelledby="tab-javascript"
              hidden={tab !== "javascript"}
              ref={outputElement}
              {...stylex.props(styles.editor)}
            />
            <div
              id="panel-result"
              role="tabpanel"
              aria-labelledby="tab-result"
              hidden={tab !== "result"}
              {...stylex.props(styles.editor)}
            >
              <Result
                outputs={outputs}
                phase={state.phase}
                toolbar={runtimeToolbar}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
