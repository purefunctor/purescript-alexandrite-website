use playground_compiler::{SourceFile, compile_sources};

fn file(path: &str, source: &str) -> SourceFile {
    SourceFile {
        path: path.into(),
        source: source.into(),
    }
}

#[test]
fn edits_errors_and_renames_are_isolated() {
    for (name, expression, success) in [
        ("Main", "42", true),
        ("Renamed", "missing", false),
        ("Renamed", "43", true),
        ("Main", "", false),
        ("Main", "44", true),
    ] {
        let result = compile_sources(
            &[],
            &[file(
                "Main.purs",
                &format!("module {name} where\nvalue :: Int\nvalue = {expression}"),
            )],
        );
        assert_eq!(result.outputs.is_empty(), !success, "{result:?}");
        if success {
            assert!(
                result
                    .outputs
                    .iter()
                    .any(|o| o.path == format!("{name}/index.js") && o.source.contains(expression))
            );
        }
    }
}

#[test]
fn cycles_missing_imports_and_type_errors_block_codegen() {
    for files in [
        vec![file(
            "Main.purs",
            "module Main where\nimport Missing\nx = 1",
        )],
        vec![file("Main.purs", "module Main where\nx :: String\nx = 1")],
        vec![
            file("A.purs", "module A where\nimport B\nx = 1"),
            file("B.purs", "module B where\nimport A\ny = 2"),
        ],
        vec![file("A.purs", "module A where\nimport A\nx = 1")],
    ] {
        let result = compile_sources(&[], &files);
        assert!(result.outputs.is_empty(), "{result:?}");
        assert!(
            result.diagnostics.iter().any(|d| d.severity == "error"),
            "{result:?}"
        );
    }
}

#[test]
fn foreign_sources_are_validated_and_returned_as_text() {
    let source = file(
        "Main.purs",
        "module Main where\nforeign import value :: Int",
    );
    let result = compile_sources(&[], &[source.clone()]);
    assert!(result.outputs.is_empty());
    let result = compile_sources(
        &[],
        &[source.clone(), file("Main.js", "export const value = 42;")],
    );
    assert!(
        result.outputs.iter().any(|o| o.path == "Main/foreign.js"),
        "{result:?}"
    );
    for js in ["export const other = 1;", "export const value = ;"] {
        assert!(
            compile_sources(&[], &[source.clone(), file("Main.js", js)])
                .outputs
                .is_empty()
        );
    }
}

#[test]
fn registry_prelude_generates_javascript() {
    fn collect(dir: &std::path::Path, files: &mut Vec<SourceFile>) {
        for entry in std::fs::read_dir(dir).unwrap() {
            let path = entry.unwrap().path();
            if path.is_dir() {
                collect(&path, files);
            } else if matches!(
                path.extension().and_then(|s| s.to_str()),
                Some("purs" | "js")
            ) {
                files.push(file(
                    path.to_str().unwrap(),
                    &std::fs::read_to_string(&path).unwrap(),
                ));
            }
        }
    }
    let mut packages = vec![];
    collect(
        &std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("prelude-6.0.2/src"),
        &mut packages,
    );
    let result = compile_sources(
        &packages,
        &[file(
            "Main.purs",
            "module Main where\nimport Prelude\nanswer :: Int\nanswer = 20 + 22",
        )],
    );
    assert!(
        !result.diagnostics.iter().any(|d| d.severity == "error"),
        "{:#?}",
        result.diagnostics
    );
    assert!(
        result
            .outputs
            .iter()
            .any(|o| o.path == "Main/index.js" && o.source.contains("answer"))
    );
    assert!(
        result
            .outputs
            .iter()
            .any(|o| o.path.ends_with("/foreign.js"))
    );
}

#[test]
fn duplicate_and_reserved_inputs_are_diagnostics() {
    for files in [
        vec![file("prim/Prim.purs", "module Other where\nx = 1")],
        vec![file("Main.purs", "module Prim where\nx = 1")],
        vec![
            file("A.purs", "module Main where\nx = 1"),
            file("B.purs", "module Main where\nx = 2"),
        ],
        vec![
            file("A.purs", "module A where\nx = 1"),
            file("A.purs", "module B where\nx = 2"),
        ],
    ] {
        let result = compile_sources(&[], &files);
        assert!(result.outputs.is_empty());
        assert!(!result.diagnostics.is_empty());
    }
}
