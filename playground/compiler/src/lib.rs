//! Compile-only website adapter. Spans are half-open UTF-8 byte offsets, not JS UTF-16 offsets.
mod engine;

use building_types::{QueryProxy, QueryResult};
use diagnostics::{DiagnosticsContext, ToDiagnostics};
use engine::Engine;
use files::{FileId, ForeignFileCandidates, ForeignSourceKind};
use functional::ExternalQueries;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct SourceFile {
    pub path: String,
    pub source: String,
}

#[derive(Debug, Serialize)]
pub struct Diagnostic {
    pub path: String,
    pub message: String,
    pub severity: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end: Option<usize>,
}

#[derive(Default, Debug, Serialize)]
pub struct CompileResult {
    pub outputs: Vec<SourceFile>,
    pub diagnostics: Vec<Diagnostic>,
}

impl CompileResult {
    fn error(&mut self, path: &str, message: impl ToString) {
        self.diagnostics.push(Diagnostic {
            path: path.into(),
            message: message.to_string(),
            severity: "error".into(),
            start: None,
            end: None,
        });
    }
    fn extend(
        &mut self,
        path: &str,
        diagnostics: impl IntoIterator<Item = diagnostics::Diagnostic>,
    ) {
        self.diagnostics.extend(diagnostics.into_iter().map(|d| {
            Diagnostic {
                path: path.into(),
                message: d.message,
                severity: match d.severity {
                    diagnostics::Severity::Error => "error",
                    diagnostics::Severity::Warning => "warning",
                }
                .into(),
                start: Some(d.span.start as usize),
                end: Some(d.span.end as usize),
            }
        }));
    }
    fn failed(&self) -> bool {
        self.diagnostics.iter().any(|d| d.severity == "error")
    }
}

#[wasm_bindgen]
pub struct Compiler {
    packages: Vec<SourceFile>,
}

fn decode(value: JsValue) -> Result<Vec<SourceFile>, JsValue> {
    serde_wasm_bindgen::from_value(value).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
impl Compiler {
    #[wasm_bindgen(constructor)]
    pub fn new(packages: JsValue) -> Result<Compiler, JsValue> {
        console_error_panic_hook::set_once();
        Ok(Self {
            packages: if packages.is_undefined() || packages.is_null() {
                vec![]
            } else {
                decode(packages)?
            },
        })
    }
    #[wasm_bindgen(js_name = setPackages)]
    pub fn set_packages(&mut self, packages: JsValue) -> Result<(), JsValue> {
        self.packages = decode(packages)?;
        Ok(())
    }
    pub fn compile(&self, files: JsValue) -> Result<JsValue, JsValue> {
        let result = compile_sources(&self.packages, &decode(files)?);
        serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

/// All supplied modules are validated. Any error suppresses ALL generated outputs.
/// The engine, module map, interners and caches are discarded after each request.
pub fn compile_sources(packages: &[SourceFile], files: &[SourceFile]) -> CompileResult {
    let mut engine = Engine::new();
    let mut result = CompileResult::default();
    let mut ids = vec![];
    let mut queue = std::collections::VecDeque::new();
    let mut paths = std::collections::HashSet::new();
    for (index, file) in packages.iter().chain(files).enumerate() {
        if file.path.is_empty()
            || engine.files.id(&file.path).is_some()
            || !paths.insert(&file.path)
        {
            result.error(&file.path, "Empty, reserved or duplicate source path");
            continue;
        }
        if file.path.ends_with(".js") {
            engine.foreign.insert(
                ForeignSourceKind::JavaScript,
                file.path.as_str(),
                file.source.as_str(),
            );
        } else if file.path.ends_with(".purs") {
            let id = engine
                .files
                .insert(file.path.as_str(), file.source.as_str());
            let (parsed, errors) = engine.parsed(id).expect("registered content");
            for error in errors.iter() {
                result.diagnostics.push(Diagnostic {
                    path: file.path.clone(),
                    message: error.message.to_string(),
                    severity: "error".into(),
                    start: Some(error.offset),
                    end: Some(error.offset),
                });
            }
            if let Some(name) = parsed.module_name(&file.source) {
                if engine.modules.contains_key(name.as_str()) {
                    result.error(&file.path, format!("Duplicate or reserved module: {name}"));
                } else {
                    engine.modules.insert(name.to_string(), id);
                }
            } else {
                result.error(&file.path, "Missing module name");
            }
            ids.push(id);
            if index >= packages.len() {
                queue.push_back(id);
            }
        } else {
            result.error(&file.path, "Only .purs and .js source files are supported");
        }
    }
    if result.failed() {
        return result;
    }
    for &id in &ids {
        if let Err(error) = check(&engine, id, &mut result) {
            result.error(&engine.files.path(id), error);
        }
    }
    if result.failed() {
        return result;
    }
    // The compiler deliberately represents some incomplete editor syntax as Error
    // expressions without emitting frontend diagnostics. Never generate its runtime
    // error placeholders for the compile-only playground.
    for &id in &ids {
        match engine.functional(id) {
            Ok(Ok(module)) => {
                if module
                    .storage
                    .expressions()
                    .any(|(_, e)| matches!(e.kind, functional::tree::ExpressionKind::Error))
                {
                    result.error(&engine.files.path(id), "Incomplete or invalid expression");
                }
            }
            Ok(Err(error)) => result.error(&engine.files.path(id), error),
            Err(error) => result.error(&engine.files.path(id), error),
        }
    }
    if result.failed() {
        return result;
    }
    let mut runtime = false;
    let mut emitted = std::collections::HashSet::new();
    while let Some(id) = queue.pop_front() {
        if !emitted.insert(id) {
            continue;
        }
        let path = engine.files.path(id);
        match javascript::convert_module(&engine, id) {
            Ok(Ok(module)) => {
                queue.extend(module.dependencies().iter().copied());
                if !module.diagnostics().is_empty() {
                    // Backend diagnostics can include errors; preserve their proper spans/severity.
                    if let Err(error) = backend_diagnostics(&engine, id, &module, &mut result) {
                        result.error(&path, error);
                    }
                }
                runtime |= module.requires_runtime();
                result.outputs.push(SourceFile {
                    path: module.filename(),
                    source: module.source().into(),
                });
                if let Some(kind) = module.foreign_kind() {
                    if let Some(foreign) = engine.foreign_id(id) {
                        result.outputs.push(SourceFile {
                            path: javascript::foreign_module_filename(module.name(), kind),
                            source: engine.foreign.content(foreign).to_string(),
                        });
                    }
                }
            }
            Ok(Err(error)) => result.error(&path, error),
            Err(error) => result.error(&path, error),
        }
    }
    if runtime {
        result.outputs.push(SourceFile {
            path: javascript::runtime_filename().into(),
            source: javascript::runtime_source().into(),
        });
    }
    if result.failed() {
        result.outputs.clear();
    }
    result
}

fn check(engine: &Engine, id: FileId, result: &mut CompileResult) -> QueryResult<()> {
    let content = engine.content(id)?;
    let root = engine.parsed(id)?.0.syntax_node();
    let stabilized = engine.stabilized(id)?;
    let indexed = engine.indexed(id)?;
    let resolved = engine.resolved(id)?;
    let lowered = engine.lowered(id)?;
    let grouped = engine.grouped(id)?;
    let checked = engine.checked(id)?;
    let context = DiagnosticsContext::new(
        engine,
        &content,
        &root,
        &stabilized,
        &indexed,
        &lowered,
        &checked,
    );
    let path = engine.files.path(id);
    for error in &indexed.errors {
        result.extend(&path, error.to_diagnostics(&context));
    }
    for error in &resolved.errors {
        result.extend(&path, error.to_diagnostics(&context));
    }
    for error in &lowered.errors {
        result.extend(&path, error.to_diagnostics(&context));
    }
    for error in &grouped.cycle_errors {
        result.extend(&path, error.to_diagnostics(&context));
    }
    for error in &checked.errors {
        result.extend(&path, error.to_diagnostics(&context));
    }
    let mut candidates = ForeignFileCandidates::default();
    let foreign = engine.foreign_id(id).map(|id| {
        candidates.insert(id);
        let parsed = foreign_javascript::parse_module(id.kind(), &engine.foreign.content(id));
        // Unlike the CLI's opaque-FFI fallback, the playground requires valid JS.
        for error in parsed.errors.iter() {
            result.error(&engine.foreign.path(id), error);
        }
        parsed
    });
    let validation = foreign_javascript::validate_module(&indexed, candidates, foreign.as_ref());
    for error in validation.errors.iter() {
        result.extend(&path, error.to_diagnostics(&context));
    }
    Ok(())
}

fn backend_diagnostics(
    engine: &Engine,
    id: FileId,
    module: &javascript::Module,
    result: &mut CompileResult,
) -> QueryResult<()> {
    let content = engine.content(id)?;
    let root = engine.parsed(id)?.0.syntax_node();
    let stabilized = engine.stabilized(id)?;
    let indexed = engine.indexed(id)?;
    let lowered = engine.lowered(id)?;
    let checked = engine.checked(id)?;
    let context = DiagnosticsContext::new(
        engine,
        &content,
        &root,
        &stabilized,
        &indexed,
        &lowered,
        &checked,
    );
    for diagnostic in module.diagnostics() {
        result.extend(&engine.files.path(id), diagnostic.to_diagnostics(&context));
    }
    Ok(())
}
