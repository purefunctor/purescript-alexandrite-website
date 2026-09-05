# Agent guide

This repository is the Alexandrite website: Astro handles routing and server rendering on Cloudflare Workers; React components are implemented in PureScript and compiled with Alexandrite.

## Sources of truth

- Treat `purefunctor/purescript-alexandrite` as the source of truth for compiler behaviour, architecture, compatibility, and performance claims. In Amp, inspect the additional checkout at `../repos/purescript-alexandrite`; if it is unavailable, use Librarian to research that repository instead of inferring from website-local code.
- Substantiate product copy before weakening it. Benchmark this website with the release compiler when evaluating build-speed claims, and separate compiler time from Spago and Vite overhead.
- References to existing PureScript libraries and projects describe Alexandrite's compatibility testing against the PureScript Registry package set. Consult `tests-compatibility` and its CI workflows in the compiler repository for the current scope and evidence.

## Implementation conventions

### Routing

- Astro server-renders routes by default. Add `export const prerender = true` to an Astro page when it can be generated as a static asset instead.

### PureScript and JavaScript boundaries

- Keep all first-party PureScript modules under `Website`, with matching paths in `src/Website`. Shared UI belongs in `Website.Components`; page-specific modules belong in `Website.Landing` or `Website.Playground`. Keep FFI companions alongside their PureScript modules.
- Keep playground UI and React hooks in `src/Website/Playground/Index.purs` and `src/Website/Playground/Result.purs`. Their JavaScript FFI companions implement browser effects: Monaco and compiler workers, focus, runtime loading and sandbox messaging. PureScript hooks own state and cleanup.
- Author component StyleX declarations in PureScript using `Alexandrite.StyleX`. Alexandrite emits statically analyzable StyleX calls for the Vite plugin; JavaScript FFI is not required for styling.
- Keep component-local styles inline. Extract styles into colocated modules when shared by multiple consumers, such as `Website.Components.Header.Styles`. Use `StyleX.recordProps` instead of repetitive individual `StyleX.props` bindings; retain `StyleX.props` for compositions and conditional styles.

### Component exports

- Name a module's single, directly consumable `ReactComponent` export `component`, and consume it through the qualified module name, such as `Index.component`. This fluent module style is the intended boundary for Astro and JavaScript consumers.
- Use a descriptive component name, such as `header`, for an effectful `Component props` constructor that callers must instantiate during component construction.
- When a module exports multiple peer `ReactComponent` values and none is the canonical module component, give each value a descriptive name rather than using `component`.

### Playground security

- Before adding network access, persistence, sharing or arbitrary npm dependencies, revisit the playground isolation policy described in [README.md](README.md#execution-boundary). The absence of accounts does not remove XSS risk; hostile public execution warrants a separate origin and stronger resource isolation.

## Design constraints

### Visual direction and composition

- Treat 2000s web and graphic design as the primary visual direction, rebuilt with contemporary responsiveness and accessibility. Lean into expressive asymmetry, compressed editorial lockups, stark contrast, hard flat color, and controlled tension rather than merely quoting the period through nostalgic effects.
- Use whitespace, negative space, and sharp, corner-led composition to separate large content regions. "Edgy" means angular, hard-edged geometry—not literal borders around sections. Keep large blocks square and avoid enclosing every section in a rounded card.

### Headings

- Avoid eyebrow or overline text for page and section headings.
- Eyebrow text is appropriate inside contained components, such as cards, when it acts as the component's label or title.

### Controls and status

- Reserve full rounding for focused interactive elements such as calls to action and status pills.
- Give transparent actions a subtle background fill so they remain identifiable beside prose, then strengthen that fill on hover. Do not add a persistent border.
- Set status pills in the sans-serif typeface with high-contrast colors. Add a border only when a light treatment needs separation from its background.
- Preserve macOS cursor semantics by using the regular arrow cursor for controls such as buttons and toggles on macOS. Button-styled navigation links also use the regular arrow cursor on every platform; inline text hyperlinks use the pointing-hand cursor. Continue to communicate interactivity through shape, contrast, hover, and focus treatments.

### Color tokens

- Define shared color tokens in `src/global.css` using OKLCH, then reference those tokens from StyleX declarations. Create related states by varying OKLCH lightness or chroma while preserving hue instead of introducing disconnected hex values.

## Local workflow

See [README.md](README.md) for installation prerequisites and standard development commands.

### Orb setup and preview

- `.agents/setup` installs Node.js 22, the pinned pnpm and compiler tools, then builds the production website and release WASM with two Cargo jobs by default. `.amp/with-alexandrite` supplies the native release compiler from `ALEXANDRITE_REPOSITORY` (default: `../repos/purescript-alexandrite`).
- `.agents/resume` runs `amp orb services ensure` to start the managed `website` production preview and register its portal. Service startup does not run compiler watchers or rebuild WASM. Refresh the preview after source changes with:

```sh
amp orb service stop website
.amp/with-alexandrite pnpm build
amp orb service restart website
```

## Verification

### Visual changes

- When visually reviewing a change with screenshots, capture and inspect representative mobile and desktop viewports so responsive regressions are considered together.

### Playground checks

```sh
pnpm test:playground
node scripts/build-playground-wasm.mjs --test-native
PLAYGROUND_PACKAGES="$PWD/public/playground/packages.json" node scripts/build-playground-wasm.mjs --test-wasm
# Requires installed agent-browser and a running dev/preview server:
node scripts/test-playground-browser.mjs http://localhost:4321/playground
```

## Maintaining this guide

- Keep agent-facing implementation conventions, verification commands and orb workflows in `AGENTS.md`, and update them when those practices change. Keep `README.md` focused on the project overview, setup, usage and documented limitations; link to guidance rather than duplicating it.
- Put each rule in its owning section. Keep commands with their prerequisites, and link to detailed contracts rather than copying them into this guide.
