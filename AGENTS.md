# Design guidance

- Avoid eyebrow or overline text for page and section headings.
- Eyebrow text is appropriate inside contained components, such as cards, when it acts as the component's label or title.
- Treat 2000s web and graphic design as the primary visual direction, rebuilt with contemporary responsiveness and accessibility. Lean into expressive asymmetry, compressed editorial lockups, stark contrast, hard flat color, and controlled tension rather than merely quoting the period through nostalgic effects.
- Use whitespace, negative space, and sharp, corner-led composition to separate large content regions. "Edgy" means angular, hard-edged geometry—not literal borders around sections. Keep large blocks square and avoid enclosing every section in a rounded card.
- Reserve full rounding for focused interactive elements such as calls to action and status pills.
- Give transparent actions a subtle background fill so they remain identifiable beside prose, then strengthen that fill on hover. Do not add a persistent border.
- Set status pills in the sans-serif typeface with high-contrast colors. Add a border only when a light treatment needs separation from its background.
- Preserve macOS cursor semantics by using the regular arrow cursor for controls such as buttons and toggles on macOS. Button-styled navigation links also use the regular arrow cursor on every platform; inline text hyperlinks use the pointing-hand cursor. Continue to communicate interactivity through shape, contrast, hover, and focus treatments.
- Define shared color tokens in `src/global.css` using OKLCH, then reference those tokens from StyleX declarations. Create related states by varying OKLCH lightness or chroma while preserving hue instead of introducing disconnected hex values.
- When visually reviewing a change with screenshots, capture and inspect representative mobile and desktop viewports so responsive regressions are considered together.

# StyleX

- Author StyleX declarations in JavaScript FFI modules so the StyleX compiler can statically analyze them.

# Compiler context and product claims

- Treat `purefunctor/purescript-alexandrite` as the source of truth for compiler behaviour, architecture, compatibility, and performance claims. In Amp, inspect the additional checkout at `../repos/purescript-alexandrite`; if it is unavailable, use Librarian to research that repository instead of inferring from website-local code.
- Substantiate product copy before weakening it. Benchmark this website with the release compiler when evaluating build-speed claims, and separate compiler time from Spago and Vite overhead.
- References to existing PureScript libraries and projects describe Alexandrite's compatibility testing against the PureScript Registry package set. Consult `tests-compatibility` and its CI workflows for the current scope and evidence.
