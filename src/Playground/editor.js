import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution.js";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker.js?worker";

self.MonacoEnvironment = { getWorker: () => new EditorWorker() };

monaco.languages.register({ id: "purescript" });
monaco.languages.setLanguageConfiguration("purescript", {
  comments: { lineComment: "--", blockComment: ["{-", "-}"] },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
  ],
});
monaco.languages.setMonarchTokensProvider("purescript", {
  keywords: [
    "ado",
    "as",
    "case",
    "class",
    "data",
    "derive",
    "do",
    "else",
    "false",
    "forall",
    "foreign",
    "hiding",
    "if",
    "import",
    "in",
    "infix",
    "infixl",
    "infixr",
    "instance",
    "kind",
    "let",
    "module",
    "newtype",
    "of",
    "then",
    "true",
    "type",
    "where",
  ],
  tokenizer: {
    root: [
      [/--.*$/, "comment"],
      [/\{-/, "comment", "@comment"],
      [/"""/, "string", "@rawString"],
      [/"/, "string", "@string"],
      [/'(?:[^'\\]|\\.)'/, "string"],
      [/[A-Z][\w']*/, "type.identifier"],
      [
        /[a-z_][\w']*/,
        { cases: { "@keywords": "keyword", "@default": "identifier" } },
      ],
      [/\b(?:0x[\da-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/, "number"],
      [/[!#$%&*+./<=>?@\\^|:~\-]+|[∀→⇒←∷]/, "operator"],
      [/[{}()[\]]/, "@brackets"],
    ],
    comment: [
      [/\{-/, "comment", "@push"],
      [/-\}/, "comment", "@pop"],
      [/[^{}-]+|[{}-]/, "comment"],
    ],
    string: [
      [/\\./, "string.escape"],
      [/"/, "string", "@pop"],
      [/[^\\"]+/, "string"],
    ],
    rawString: [
      [/"""/, "string", "@pop"],
      [/[^"]+|"/, "string"],
    ],
  },
});

// Monaco requires hex colors; resolve the shared OKLCH tokens through the browser.
function tokenColor(name) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d");
  context.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  context.fillRect(0, 0, 1, 1);
  return (
    "#" +
    [...context.getImageData(0, 0, 1, 1).data]
      .slice(0, 3)
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("")
  );
}

export function createEditors(sourceElement, outputElement, source, onChange) {
  const color = tokenColor;
  monaco.editor.defineTheme("alexandrite", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: color("--landing-color-latte-mauve") },
      {
        token: "type.identifier",
        foreground: color("--landing-color-latte-blue"),
      },
      { token: "string", foreground: color("--landing-color-mineral") },
      { token: "number", foreground: color("--landing-color-latte-red") },
      { token: "comment", foreground: color("--landing-color-muted") },
    ],
    colors: {
      "editor.background": color("--landing-color-surface"),
      "editor.foreground": color("--landing-color-ink"),
      "editorLineNumber.foreground": color("--landing-color-muted"),
      "editorCursor.foreground": color("--landing-color-crystal"),
      "editor.selectionBackground": color("--landing-color-signal"),
      "editor.lineHighlightBackground": color("--landing-color-paper"),
    },
  });
  const options = {
    theme: "alexandrite",
    automaticLayout: true,
    minimap: { enabled: false },
    fontFamily: "JetBrains Mono Variable, monospace",
    fontSize: 14,
    lineHeight: 24,
    padding: { top: 20, bottom: 20 },
    scrollBeyondLastLine: false,
    tabSize: 2,
    insertSpaces: true,
    tabFocusMode: true,
    renderLineHighlight: "none",
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    folding: false,
    lineNumbersMinChars: 3,
    glyphMargin: false,
    wordWrap: "on",
    fixedOverflowWidgets: true,
  };
  const inputModel = monaco.editor.createModel(
    source,
    "purescript",
    monaco.Uri.parse("file:///Main.purs"),
  );
  const outputModel = monaco.editor.createModel("", "javascript");
  const input = monaco.editor.create(sourceElement, {
    ...options,
    model: inputModel,
    ariaLabel: "PureScript source editor",
  });
  const output = monaco.editor.create(outputElement, {
    ...options,
    model: outputModel,
    readOnly: true,
    domReadOnly: true,
    ariaLabel: "Generated JavaScript, read only",
  });
  const change = inputModel.onDidChangeContent(() =>
    onChange(inputModel.getValue()),
  );
  return {
    setSource(value) {
      inputModel.setValue(value);
      input.setScrollTop(0);
      input.setPosition({ lineNumber: 1, column: 1 });
    },
    setOutput: (value) => outputModel.setValue(value),
    setDiagnostics(diagnostics) {
      monaco.editor.setModelMarkers(
        inputModel,
        "alexandrite",
        diagnostics
          .filter((diagnostic) => diagnostic.path === "Main.purs")
          .map((diagnostic) => {
            const bytes = new TextEncoder().encode(inputModel.getValue());
            const offset = (value) =>
              new TextDecoder().decode(bytes.subarray(0, value)).length;
            const start = inputModel.getPositionAt(
              offset(diagnostic.start ?? 0),
            );
            const end = inputModel.getPositionAt(
              offset(diagnostic.end ?? diagnostic.start ?? 0),
            );
            return {
              message: diagnostic.message,
              severity:
                diagnostic.severity === "warning"
                  ? monaco.MarkerSeverity.Warning
                  : monaco.MarkerSeverity.Error,
              startLineNumber: start.lineNumber,
              startColumn: start.column,
              endLineNumber: end.lineNumber,
              endColumn: end.column,
            };
          }),
      );
    },
    dispose() {
      change.dispose();
      input.dispose();
      output.dispose();
      inputModel.dispose();
      outputModel.dispose();
    },
  };
}
