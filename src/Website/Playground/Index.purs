module Website.Playground.Index (component) where

import Prelude

import Alexandrite.StyleX as StyleX
import Data.Array (elem, length, mapWithIndex, null)
import Data.Nullable (Nullable)
import Data.Nullable as Nullable
import Effect (Effect)
import Effect.Unsafe (unsafePerformEffect)
import Website.Components.Header as Header
import Website.Components.Header.Styles (controlStyles)
import Website.Playground.ExampleSelect as ExampleSelect
import Website.Playground.Result as Result
import React.Basic (ReactComponent, Ref, element)
import React.Basic.Events (EventHandler, handler_)
import React.Basic.Hooks ((/\))
import React.Basic.Hooks as Hooks
import Web.DOM.Element (Element)
import Yoga.React.DOM as DOM

type CompileState = { phase :: String, message :: String }
type Package = { name :: String, version :: String }
type Diagnostic = { path :: String, severity :: String, message :: String }

foreign import data EditorSession :: Type

foreign import initializeEditor ::
  { source :: Ref (Nullable Element)
  , output :: Ref (Nullable Element)
  , session :: Ref (Nullable EditorSession)
  , onState :: CompileState -> Effect Unit
  , onPackages :: Array Package -> Effect Unit
  , onDiagnostics :: Array Diagnostic -> Effect Unit
  , onOutputs :: Result.Outputs -> Effect Unit
  } ->
  Effect (Effect Unit)

foreign import retryCompiler :: Ref (Nullable EditorSession) -> Effect Unit
foreign import selectExample ::
  Ref (Nullable EditorSession) -> (Int -> Effect Unit) -> Int -> Effect Unit

foreign import focusElement :: Boolean -> Ref (Nullable Element) -> Effect Unit
foreign import onEscape :: Effect Unit -> EventHandler
foreign import tabKeyDown :: String -> (String -> Effect Unit) -> EventHandler

styles = StyleX.create
  { page: { height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }
  , headerControls:
      { display: "flex"
      , flexWrap: "wrap"
      , gap: 8
      , alignItems: "center"
      , justifyContent: "flex-end"
      }
  , title:
      { position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }
  , tools:
      { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginInlineStart: "auto" }
  , button:
      { backgroundColor:
          { default: "var(--landing-color-white-translucent)"
          , ":hover": "var(--playground-color-dark-action-hover)"
          }
      , color: "inherit"
      , cursor: "var(--landing-interactive-cursor, pointer)"
      , ":focus-visible": { outline: "2px solid var(--landing-color-signal)", outlineOffset: 2 }
      }
  , status: { fontSize: 12, color: "var(--landing-color-signal)", overflowWrap: "anywhere" }
  , errorStatus: { color: "var(--landing-color-paper)" }
  , skip:
      { position: "absolute"
      , insetInlineStart: 16
      , top: { default: "-100px", ":focus": "8px" }
      , zIndex: 10
      , backgroundColor: "var(--landing-color-signal)"
      , padding: 12
      }
  , main: { display: "flex", flex: 1, minHeight: 0, position: "relative" }
  , sidebar:
      { width: 280
      , maxWidth: "85vw"
      , flexShrink: 0
      , overflowY: "auto"
      , padding: 16
      , backgroundColor: "var(--landing-color-paper)"
      , position: "absolute"
      , insetBlock: 0
      , insetInlineEnd: 0
      , zIndex: 5
      , transform: "translateX(100%)"
      , visibility: "hidden"
      , transitionProperty: "transform, visibility"
      , transitionDuration: { default: "220ms", "@media (prefers-reduced-motion: reduce)": "0ms" }
      , transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)"
      , transitionDelay: { default: "0ms, 220ms", "@media (prefers-reduced-motion: reduce)": "0ms" }
      }
  , sidebarOpen: { transform: "translateX(0)", visibility: "visible", transitionDelay: "0ms" }
  , sidebarHeading:
      { display: "flex"
      , alignItems: "center"
      , justifyContent: "space-between"
      , gap: 8
      , marginBottom: 16
      }
  , close:
      { backgroundColor:
          { default: "var(--playground-color-action)"
          , ":hover": "var(--playground-color-action-hover)"
          }
      }
  , packageNote: { fontSize: 12, color: "var(--landing-color-muted)", marginBottom: 16 }
  , packages: { listStyleType: "none", padding: 0, fontSize: 12 }
  , package: { display: "flex", justifyContent: "space-between", gap: 12, paddingBlock: 5 }
  , version: { color: "var(--landing-color-muted)", fontVariantNumeric: "tabular-nums" }
  , panes:
      { display: "grid"
      , flex: 1
      , minWidth: 0
      , minHeight: 0
      , gridTemplateColumns:
          { default: "minmax(0, 1fr) minmax(0, 1fr)"
          , "@media (max-width: 800px)": "minmax(0, 1fr)"
          }
      , gridTemplateRows:
          { default: "minmax(0, 1fr)"
          , "@media (max-width: 800px)": "minmax(0, 1fr) minmax(0, 1fr)"
          }
      , gap: 1
      , backgroundColor: "var(--landing-color-paper)"
      }
  , pane:
      { display: "flex"
      , flexDirection: "column"
      , minWidth: 0
      , minHeight: 0
      , backgroundColor: "var(--landing-color-surface)"
      }
  , toolbar:
      { backgroundColor: "var(--landing-color-paper)"
      , paddingInline: 12
      , minHeight: 44
      , display: "flex"
      , gap: 12
      , alignItems: "center"
      , flexShrink: 0
      }
  , runtimeActions: { display: "flex", gap: 4, marginInlineStart: "auto", flexShrink: 0 }
  , paneTitle: { fontSize: 12, fontWeight: 550 }
  , tabs: { display: "flex", gap: 4 }
  , tab:
      { backgroundColor:
          { default: "var(--playground-color-action)"
          , ":hover": "var(--playground-color-action-hover)"
          }
      , paddingInline: 12
      , minHeight: 32
      , fontSize: 12
      , borderRadius: 999
      , cursor: "var(--landing-interactive-cursor, pointer)"
      , ":focus-visible": { outline: "2px solid var(--landing-color-crystal)", outlineOffset: 2 }
      }
  , selectedTab:
      { backgroundColor: "var(--landing-color-ink)", color: "var(--landing-color-paper)" }
  , editor: { flex: 1, minHeight: 0, minWidth: 0, overflow: "hidden" }
  , diagnostics:
      { maxHeight: "35%"
      , flexShrink: 0
      , overflowY: "auto"
      , padding: 12
      , backgroundColor: "var(--landing-color-paper)"
      }
  , diagnosticList: { paddingInlineStart: 20, fontSize: 12 }
  , diagnostic:
      { whiteSpace: "pre-wrap"
      , overflowWrap: "anywhere"
      , paddingBlock: 4
      , fontFamily: "JetBrains Mono Variable, monospace"
      }
  }

component :: ReactComponent {}
component = unsafePerformEffect $ Hooks.reactComponent "Playground" \_ -> Hooks.do
  sourceElement <- Hooks.useRef Nullable.null
  outputElement <- Hooks.useRef Nullable.null
  session <- Hooks.useRef Nullable.null
  packageButton <- Hooks.useRef Nullable.null
  packageCloseButton <- Hooks.useRef Nullable.null
  state /\ setState <- Hooks.useState' { phase: "loading", message: "Loading editor…" }
  packages /\ setPackages <- Hooks.useState' []
  diagnostics /\ setDiagnostics <- Hooks.useState' []
  outputs /\ setOutputs <- Hooks.useState' Nullable.null
  showPackages /\ setShowPackages <- Hooks.useState false
  exampleIndex /\ setExampleIndex <- Hooks.useState' 0
  tab /\ setTab <- Hooks.useState' "result"
  runtimeToolbar /\ setRuntimeToolbar <- Hooks.useState' Nullable.null
  toolbarRef <- Hooks.useMemo unit (\_ -> DOM.reactRef setRuntimeToolbar)

  Hooks.useEffectOnce $ initializeEditor
    { source: sourceElement
    , output: outputElement
    , session
    , onState: setState
    , onPackages: setPackages
    , onDiagnostics: setDiagnostics
    , onOutputs: setOutputs
    }
  Hooks.useEffect showPackages do
    when showPackages $ focusElement true packageCloseButton
    pure (pure unit)

  let
    closePackages = do
      setShowPackages (const false)
      focusElement false packageButton

  pure $ DOM.div (StyleX.props styles.page)
    [ DOM.a { href: "#playground", className: (StyleX.props styles.skip).className }
        "Skip to playground"
    , Header.playgroundHeader $ DOM.div (StyleX.props styles.headerControls)
        [ DOM.h1 (StyleX.props styles.title) "Playground"
        , DOM.p
            { id: "compile-status"
            , role: "status"
            , "aria-live": "polite"
            , hidden: state.phase `elem` [ "loading", "edited", "compiling" ]
            , className:
                ( StyleX.props
                    [ styles.status
                    , StyleX.conditional
                        (state.phase `elem` [ "failed", "editor-failed", "errors" ])
                        styles.errorStatus
                    ]
                ).className
            }
            state.message
        , DOM.div (StyleX.props styles.tools)
            [ if state.phase == "failed" then
                DOM.button
                  { type: "button"
                  , className:
                      (StyleX.props [ controlStyles.control, styles.button ]).className
                  , onClick: handler_ (retryCompiler session)
                  }
                  "Retry compiler"
              else mempty
            , DOM.button
                { ref: DOM.reactRef packageButton
                , type: "button"
                , "aria-expanded": showPackages
                , "aria-controls": "package-list"
                , className:
                    (StyleX.props [ controlStyles.control, styles.button ]).className
                , onClick: handler_ (setShowPackages not)
                }
                ("Packages" <> if null packages then "" else " (" <> show (length packages) <> ")")
            ]
        ]
    , DOM.main { id: "playground", className: (StyleX.props styles.main).className }
        [ -- Yoga's aside attributes do not yet include inert.
          DOM.createBuiltinElement "aside"
            { id: "package-list"
            , "aria-label": "Bundled packages"
            , "aria-hidden": not showPackages
            , inert: if showPackages then Nullable.null else Nullable.notNull ""
            , className:
                ( StyleX.props
                    [ styles.sidebar, StyleX.conditional showPackages styles.sidebarOpen ]
                ).className
            , onKeyDown: onEscape closePackages
            }
            [ DOM.div (StyleX.props styles.sidebarHeading)
                [ DOM.h2 (StyleX.props styles.paneTitle) "Packages · 80.8.1"
                , DOM.button
                    { ref: DOM.reactRef packageCloseButton
                    , type: "button"
                    , className:
                        (StyleX.props [ controlStyles.control, styles.button, styles.close ]).className
                    , onClick: handler_ closePackages
                    }
                    "Close"
                ]
            , DOM.p (StyleX.props styles.packageNote)
                "Available to import. Core, React Basic, React Basic Hooks, Halogen and dependencies."
            , DOM.ul (StyleX.props styles.packages) $ packages <#> \package ->
                DOM.li { key: package.name, className: (StyleX.props styles.package).className }
                  [ DOM.span {} package.name
                  , DOM.span (StyleX.props styles.version) package.version
                  ]
            ]
        , DOM.div (StyleX.props styles.panes)
            [ DOM.section
                { "aria-label": "Source", className: (StyleX.props styles.pane).className }
                [ DOM.div (StyleX.props styles.toolbar)
                    [ element ExampleSelect.component
                        { value: exampleIndex
                        , disabled: state.phase `elem` [ "loading", "editor-failed" ]
                        , onChange: selectExample session setExampleIndex
                        }
                    ]
                , DOM.div_
                    { ref: DOM.reactRef sourceElement
                    , className: (StyleX.props styles.editor).className
                    }
                , if null diagnostics then mempty
                  else DOM.section
                    { "aria-label": "Diagnostics"
                    , className: (StyleX.props styles.diagnostics).className
                    }
                    [ DOM.ul (StyleX.props styles.diagnosticList) $
                        mapWithIndex
                          ( \index diagnostic -> DOM.li
                              { key: show index
                              , className: (StyleX.props styles.diagnostic).className
                              }
                              ( diagnostic.path <> ": " <> diagnostic.severity <> " — " <>
                                  diagnostic.message
                              )
                          )
                          diagnostics
                    ]
                ]
            , DOM.section
                { "aria-label": "Output", className: (StyleX.props styles.pane).className }
                [ DOM.div (StyleX.props styles.toolbar)
                    [ DOM.div
                        { role: "tablist"
                        , "aria-label": "Output view"
                        , className: (StyleX.props styles.tabs).className
                        } $
                        [ "javascript", "result" ] <#> \name ->
                          -- Yoga's base attributes do not yet include onKeyDown.
                          DOM.createBuiltinElement "button"
                            { key: name
                            , type: "button"
                            , role: "tab"
                            , id: "tab-" <> name
                            , "aria-controls": "panel-" <> name
                            , "aria-selected": tab == name
                            , tabIndex: if tab == name then 0 else -1
                            , className:
                                ( StyleX.props
                                    [ styles.tab
                                    , StyleX.conditional (tab == name) styles.selectedTab
                                    ]
                                ).className
                            , onClick: handler_ (setTab name)
                            , onKeyDown: tabKeyDown name setTab
                            }
                            (if name == "javascript" then "JavaScript" else "Runtime")
                    , DOM.div_
                        { ref: toolbarRef
                        , className: (StyleX.props styles.runtimeActions).className
                        }
                    ]
                , DOM.div_
                    { id: "panel-javascript"
                    , role: "tabpanel"
                    , "aria-labelledby": "tab-javascript"
                    , hidden: tab /= "javascript"
                    , ref: DOM.reactRef outputElement
                    , className: (StyleX.props styles.editor).className
                    }
                , DOM.div
                    { id: "panel-result"
                    , role: "tabpanel"
                    , "aria-labelledby": "tab-result"
                    , hidden: tab /= "result"
                    , className: (StyleX.props styles.editor).className
                    }
                    [ element Result.component
                        { outputs, phase: state.phase, toolbar: runtimeToolbar }
                    ]
                ]
            ]
        ]
    ]
