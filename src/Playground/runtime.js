import { parse } from "acorn";

// Link virtual modules without evaluating code in the host page. Blob URLs and
// the import map are created inside the opaque-origin sandbox, not the parent.
export async function prepareExecution(outputs, runtime) {
  const files = [...outputs, ...runtime.files];
  const paths = new Set(files.map((file) => file.path));
  if (!outputs.length)
    throw new Error("Compile your source before running it.");
  if (paths.size !== files.length)
    throw new Error("Duplicate output module paths.");
  const linked = files.map(({ path, source }) => {
    // Parse literals without eval: this runs under the host's strict CSP.
    const imports = [];
    const nodes = [
      parse(source, { ecmaVersion: "latest", sourceType: "module" }),
    ];
    while (nodes.length) {
      const node = nodes.pop();
      if (
        [
          "ImportDeclaration",
          "ExportAllDeclaration",
          "ExportNamedDeclaration",
          "ImportExpression",
        ].includes(node.type) &&
        node.source
      ) {
        if (
          node.source.type !== "Literal" ||
          typeof node.source.value !== "string"
        )
          throw new Error(
            `Computed dynamic imports are not supported (${path}).`,
          );
        imports.push(node.source);
      }
      for (const value of Object.values(node)) {
        if (Array.isArray(value)) {
          for (const child of value) if (child?.type) nodes.push(child);
        } else if (value?.type) nodes.push(value);
      }
    }
    for (const item of imports.sort((a, b) => b.start - a.start)) {
      const dependency = item.value.startsWith(".")
        ? new URL(
            item.value,
            `https://playground.invalid/${path}`,
          ).pathname.slice(1)
        : runtime.imports[item.value];
      if (!dependency || !paths.has(dependency))
        throw new Error(
          `Module “${item.value}” needed by ${path} is not bundled.`,
        );
      const replacement = JSON.stringify(`playground/${dependency}`);
      source =
        source.slice(0, item.start) + replacement + source.slice(item.end);
    }
    return { path: `playground/${path}`, source };
  });
  return { entry: `playground/${outputs[0].path}`, files: linked };
}
