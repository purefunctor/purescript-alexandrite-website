//! Request-local, single-threaded compiler queries. No compiler daemon or docs API.
use std::{cell::RefCell, sync::Arc};

use building_types::{QueryError, QueryKey, QueryProxy, QueryResult};
use files::{FileId, Files, ForeignFileId, ForeignFiles};
use rustc_hash::FxHashMap;

#[derive(Default)]
struct Cache {
    parsed: FxHashMap<FileId, parsing::FullParsedModule>,
    stabilized: FxHashMap<FileId, Arc<stabilizing::StabilizedModule>>,
    indexed: FxHashMap<FileId, Arc<indexing::IndexedModule>>,
    resolved: FxHashMap<FileId, Arc<resolving::ResolvedModule>>,
    exported: FxHashMap<FileId, Arc<resolving::ExportedModule>>,
    lowered: FxHashMap<FileId, Arc<lowering::LoweredModule>>,
    grouped: FxHashMap<FileId, Arc<lowering::GroupedModule>>,
    bracketed: FxHashMap<FileId, Arc<sugar::Bracketed>>,
    sectioned: FxHashMap<FileId, Arc<sugar::Sectioned>>,
    checked: FxHashMap<FileId, Arc<checking::CheckedModule>>,
    functional: FxHashMap<FileId, functional::ModuleResult<Arc<functional::tree::Module>>>,
}

pub struct Engine {
    pub files: Files,
    pub foreign: ForeignFiles,
    pub modules: FxHashMap<String, FileId>,
    cache: RefCell<Cache>,
    stack: RefCell<Vec<QueryKey>>,
    interners: checking::CoreInterners,
    prim: FileId,
}

// Borrow neither the cache nor the stack across a recursive compiler query.
macro_rules! cached {
    ($self:ident, $id:ident, $field:ident, $key:ident, $body:expr) => {{
        if let Some(value) = $self.cache.borrow().$field.get(&$id) {
            return Ok(value.clone());
        }
        let key = QueryKey::$key($id);
        if $self.stack.borrow().contains(&key) {
            return Err(QueryError::Cycle {
                stack: $self.stack.borrow().clone().into(),
            });
        }
        $self.stack.borrow_mut().push(key);
        let result = (|| $body)();
        $self.stack.borrow_mut().pop();
        let value = result?;
        $self.cache.borrow_mut().$field.insert($id, value.clone());
        Ok(value)
    }};
}

impl Engine {
    pub fn new() -> Self {
        let mut files = Files::default();
        let mut modules = FxHashMap::default();
        for (name, source) in prim_constants::MODULE_MAP {
            let id = files.insert(format!("prim/{name}.purs"), *source);
            modules.insert(name.to_string(), id);
        }
        let prim = modules["Prim"];
        Self {
            files,
            modules,
            prim,
            foreign: ForeignFiles::default(),
            cache: RefCell::default(),
            stack: RefCell::default(),
            interners: checking::CoreInterners::default(),
        }
    }

    pub fn foreign_id(&self, id: FileId) -> Option<ForeignFileId> {
        let path = self.files.path(id);
        self.foreign
            .id(&format!("{}.js", path.strip_suffix(".purs")?))
    }
}

impl QueryProxy for Engine {
    type Parsed = parsing::FullParsedModule;
    type Stabilized = Arc<stabilizing::StabilizedModule>;
    type Indexed = Arc<indexing::IndexedModule>;
    type Resolved = Arc<resolving::ResolvedModule>;
    type Exported = Arc<resolving::ExportedModule>;
    type Lowered = Arc<lowering::LoweredModule>;
    type Grouped = Arc<lowering::GroupedModule>;
    type Bracketed = Arc<sugar::Bracketed>;
    type Sectioned = Arc<sugar::Sectioned>;
    type Checked = Arc<checking::CheckedModule>;
    type Documented = Arc<documenting::DocumentedModule>;

    fn content(&self, id: FileId) -> QueryResult<Arc<str>> {
        if !self.files.contains(id) {
            return Err(QueryError::MissingContent { file_id: id });
        }
        Ok(self.files.content(id))
    }
    fn parsed(&self, id: FileId) -> QueryResult<Self::Parsed> {
        cached!(self, id, parsed, Parsed, {
            let source = self.content(id)?;
            let lexed = lexing::lex(&source);
            Ok::<_, QueryError>(parsing::parse(&lexed, &lexing::layout(&lexed)))
        })
    }
    fn stabilized(&self, id: FileId) -> QueryResult<Self::Stabilized> {
        cached!(self, id, stabilized, Stabilized, {
            Ok::<_, QueryError>(Arc::new(stabilizing::stabilize_module(
                &self.parsed(id)?.0.syntax_node(),
            )))
        })
    }
    fn indexed(&self, id: FileId) -> QueryResult<Self::Indexed> {
        cached!(self, id, indexed, Indexed, {
            Ok::<_, QueryError>(Arc::new(indexing::index_module(
                &self.content(id)?,
                &self.parsed(id)?.0.cst(),
                &*self.stabilized(id)?,
            )))
        })
    }
    fn resolved(&self, id: FileId) -> QueryResult<Self::Resolved> {
        cached!(self, id, resolved, Resolved, {
            Ok::<_, QueryError>(Arc::new(resolving::resolve_module(self, id)?))
        })
    }
    fn exported(&self, id: FileId) -> QueryResult<Self::Exported> {
        cached!(self, id, exported, Exported, {
            Ok::<_, QueryError>(Arc::new(resolving::export_module(&*self.resolved(id)?)))
        })
    }
    fn lowered(&self, id: FileId) -> QueryResult<Self::Lowered> {
        cached!(self, id, lowered, Lowered, {
            Ok::<_, QueryError>(Arc::new(lowering::lower_module(
                id,
                &self.content(id)?,
                &self.parsed(id)?.0.cst(),
                &*self.resolved(self.prim)?,
                &*self.stabilized(id)?,
                &*self.indexed(id)?,
                &*self.resolved(id)?,
            )))
        })
    }
    fn grouped(&self, id: FileId) -> QueryResult<Self::Grouped> {
        cached!(self, id, grouped, Grouped, {
            Ok::<_, QueryError>(Arc::new(lowering::group_module(
                &*self.indexed(id)?,
                &*self.lowered(id)?,
            )))
        })
    }
    fn bracketed(&self, id: FileId) -> QueryResult<Self::Bracketed> {
        cached!(self, id, bracketed, Bracketed, {
            Ok::<_, QueryError>(Arc::new(sugar::bracketed(self, &*self.lowered(id)?)?))
        })
    }
    fn sectioned(&self, id: FileId) -> QueryResult<Self::Sectioned> {
        cached!(self, id, sectioned, Sectioned, {
            Ok::<_, QueryError>(Arc::new(sugar::sectioned(&*self.lowered(id)?)))
        })
    }
    fn checked(&self, id: FileId) -> QueryResult<Self::Checked> {
        cached!(self, id, checked, Checked, {
            Ok::<_, QueryError>(Arc::new(checking::check_module(self, id)?))
        })
    }
    fn documented(&self, id: FileId) -> QueryResult<Self::Documented> {
        Ok(documenting::document_module(
            &self.content(id)?,
            &self.parsed(id)?.0,
            &*self.stabilized(id)?,
            &*self.indexed(id)?,
        ))
    }
    fn prim_id(&self) -> FileId {
        self.prim
    }
    fn module_file(&self, name: &str) -> Option<FileId> {
        self.modules.get(name).copied()
    }
}

impl checking::PrettyQueries for Engine {
    fn lookup_type(&self, id: checking::core::TypeId) -> checking::core::Type {
        self.interners.lookup_type(id)
    }
    fn lookup_forall_binder(
        &self,
        id: checking::core::ForallBinderId,
    ) -> checking::core::ForallBinder {
        self.interners.lookup_forall_binder(id)
    }
    fn lookup_row_type(&self, id: checking::core::RowTypeId) -> checking::core::RowType {
        self.interners.lookup_row_type(id)
    }
    fn lookup_smol_str(&self, id: checking::core::SmolStrId) -> smol_str::SmolStr {
        self.interners.lookup_smol_str(id)
    }
}
impl checking::ExternalQueries for Engine {
    fn lookup_type_flags(&self, id: checking::core::TypeId) -> checking::core::TypeFlags {
        self.interners.lookup_type_flags(id)
    }
    fn intern_type(&self, value: checking::core::Type) -> checking::core::TypeId {
        self.interners.intern_type(value)
    }
    fn intern_forall_binder(
        &self,
        value: checking::core::ForallBinder,
    ) -> checking::core::ForallBinderId {
        self.interners.intern_forall_binder(value)
    }
    fn intern_row_type(&self, value: checking::core::RowType) -> checking::core::RowTypeId {
        self.interners.intern_row_type(value)
    }
    fn intern_smol_str(&self, value: smol_str::SmolStr) -> checking::core::SmolStrId {
        self.interners.intern_smol_str(value)
    }
}
impl resolving::ExternalQueries for Engine {}
impl sugar::ExternalQueries for Engine {}
impl functional::ExternalQueries for Engine {
    fn functional(
        &self,
        id: FileId,
    ) -> QueryResult<functional::ModuleResult<Arc<functional::tree::Module>>> {
        cached!(self, id, functional, Functional, {
            Ok::<_, QueryError>(functional::convert_module(self, id)?.map(Arc::new))
        })
    }
}
impl javascript::ExternalQueries for Engine {
    fn foreign_file(&self, id: FileId) -> QueryResult<Option<ForeignFileId>> {
        Ok(self.foreign_id(id))
    }
}
