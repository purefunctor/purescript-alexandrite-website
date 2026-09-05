module Website.Playground.Index (component) where

import Prelude

import Alexandrite.StyleX as StyleX
import Data.Array (elem, length, mapWithIndex, null)
import Data.Maybe (Maybe(..))
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
import Yoga.React.DOM.Attributes.Target (targetBlank)

type CompileState = { phase :: String, message :: String }
type Notice = { path :: String, source :: String }
type Package =
  { name :: String
  , version :: String
  , license :: String
  , pursuitUrl :: String
  , repositoryUrl :: String
  , notices :: Array Notice
  }

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
foreign import data DialogSession :: Type
foreign import initializeDialogs ::
  { packages :: Ref (Nullable Element)
  , license :: Ref (Nullable Element)
  , session :: Ref (Nullable DialogSession)
  } ->
  Effect (Effect Unit)

foreign import syncPackageDialog :: Boolean -> Ref (Nullable DialogSession) -> Effect Unit
foreign import syncLicenseDialog :: Boolean -> Ref (Nullable DialogSession) -> Effect Unit
foreign import observePackageScroll :: Ref (Nullable Element) -> Effect (Effect Unit)
foreign import cancelPackageDialog :: Effect Unit -> EventHandler
foreign import dismissPackageBackdrop :: Effect Unit -> EventHandler
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
      , height: "100dvh"
      , maxHeight: "100dvh"
      , margin: 0
      , marginInlineStart: "auto"
      , borderWidth: 0
      , borderStyle: "none"
      , outline: "none"
      , display: { default: "none", ":is([open])": "flex" }
      , flexDirection: "column"
      , color: "var(--landing-color-ink)"
      , flexShrink: 0
      , overflow: "hidden"
      , padding: 16
      , backgroundColor: "var(--landing-color-paper)"
      , "::backdrop": { backgroundColor: "var(--playground-color-backdrop)" }
      , position: "fixed"
      , insetBlock: 0
      , insetInlineEnd: 0
      , zIndex: 5
      }
  , sidebarHeading:
      { display: "flex"
      , alignItems: "center"
      , justifyContent: "space-between"
      , gap: 8
      , marginBottom: 16
      , flexShrink: 0
      }
  , close:
      { backgroundColor:
          { default: "var(--playground-color-action)"
          , ":hover": "var(--playground-color-action-hover)"
          }
      }
  , packageNote:
      { fontSize: 12, color: "var(--landing-color-muted)", marginBottom: 16, flexShrink: 0 }
  , packages:
      { listStyleType: "none"
      , padding: 0
      , paddingInlineEnd: 12
      , marginInlineEnd: -16
      , scrollbarGutter: "stable"
      , fontSize: 12
      , flex: 1
      , minHeight: 0
      , overflowY: "auto"
      , maskImage:
          "linear-gradient(to bottom, rgb(0 0 0 / var(--package-top-opacity, 1)), black 40px, black calc(100% - 40px), rgb(0 0 0 / var(--package-bottom-opacity, 1)))"
      }
  , package:
      { display: "grid"
      , gridTemplateColumns: "minmax(0, 1fr) auto"
      , columnGap: 12
      , rowGap: 4
      , paddingBlock: 7
      }
  , packageName:
      { color: "inherit"
      , minWidth: 0
      , overflowWrap: "anywhere"
      , cursor: "pointer"
      , ":focus-visible": { outline: "2px solid var(--landing-color-crystal)", outlineOffset: 2 }
      }
  , version:
      { color: "var(--landing-color-muted)"
      , fontVariantNumeric: "tabular-nums"
      , paddingInlineEnd: 4
      }
  , licenseButton:
      { gridColumn: "1 / -1"
      , justifySelf: "start"
      , minHeight: 28
      , paddingInline: 8
      , borderRadius: 999
      , backgroundColor:
          { default: "var(--playground-color-action)"
          , ":hover": "var(--playground-color-action-hover)"
          }
      , cursor: "var(--landing-interactive-cursor, pointer)"
      , ":focus-visible": { outline: "2px solid var(--landing-color-crystal)", outlineOffset: 2 }
      }
  , licenseDialog:
      { width: "min(720px, calc(100vw - 32px))"
      , maxWidth: "calc(100vw - 32px)"
      , margin: "auto"
      , outline: "none"
      , height: "min(760px, calc(100dvh - 32px))"
      , maxHeight: "calc(100dvh - 32px)"
      , padding: 0
      , borderWidth: 0
      , borderStyle: "none"
      , color: "var(--landing-color-ink)"
      , backgroundColor: "var(--landing-color-surface)"
      , overflow: "hidden"
      , flexDirection: "column"
      , display: { default: "none", ":is([open])": "flex" }
      , "::backdrop": { backgroundColor: "var(--playground-color-backdrop)" }
      }
  , licenseHeader:
      { display: "flex"
      , justifyContent: "space-between"
      , alignItems: "center"
      , gap: 16
      , padding: 16
      , flexShrink: 0
      , backgroundColor: "var(--landing-color-paper)"
      }
  , licenseTitle: { fontSize: 16, lineHeight: 1.25 }
  , licenseContent:
      { padding: 16, overflowY: "auto", overscrollBehavior: "contain", minHeight: 0 }
  , licenseExpression: { marginBottom: 16 }
  , repositoryLink:
      { color: "inherit"
      , cursor: "pointer"
      , ":focus-visible": { outline: "2px solid var(--landing-color-crystal)", outlineOffset: 2 }
      }
  , emptyNotices: { marginTop: 16, color: "var(--landing-color-muted)" }
  , notice: { marginTop: 24 }
  , noticePath: { fontSize: 12, marginBottom: 8, overflowWrap: "anywhere" }
  , noticeSource:
      { padding: 12
      , backgroundColor: "var(--landing-color-paper)"
      , whiteSpace: "pre-wrap"
      , overflowWrap: "anywhere"
      , wordBreak: "break-word"
      , fontFamily: "JetBrains Mono Variable, monospace"
      , fontSize: 12
      }
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
  packageDialog <- Hooks.useRef Nullable.null
  packageList <- Hooks.useRef Nullable.null
  packageCloseButton <- Hooks.useRef Nullable.null
  licenseDialog <- Hooks.useRef Nullable.null
  licenseCloseButton <- Hooks.useRef Nullable.null
  dialogSession <- Hooks.useRef Nullable.null
  state /\ setState <- Hooks.useState' { phase: "loading", message: "Loading editor…" }
  packages /\ setPackages <- Hooks.useState' []
  diagnostics /\ setDiagnostics <- Hooks.useState' []
  outputs /\ setOutputs <- Hooks.useState' Nullable.null
  showPackages /\ setShowPackages <- Hooks.useState false
  selectedPackage /\ setSelectedPackage <- Hooks.useState' (Nothing :: Maybe Package)
  showLicense /\ setShowLicense <- Hooks.useState' false
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
  Hooks.useEffectOnce $ initializeDialogs
    { packages: packageDialog, license: licenseDialog, session: dialogSession }
  Hooks.useEffect showPackages do
    syncPackageDialog showPackages dialogSession
    when showPackages $ focusElement true packageCloseButton
    pure (pure unit)

  Hooks.useEffect { showPackages, count: length packages } $
    if showPackages then observePackageScroll packageList
    else pure (pure unit)

  Hooks.useEffect showLicense do
    syncLicenseDialog showLicense dialogSession
    when showLicense $ focusElement true licenseCloseButton
    pure (pure unit)

  let
    closePackages = setShowPackages (const false)
    closeLicense = setShowLicense false

  pure $ DOM.div (StyleX.props styles.page)
    [ DOM.a { href: "#playground", className: (StyleX.props styles.skip).className }
        "Skip to playground"
    , Header.playgroundHeader $ DOM.div (StyleX.props styles.headerControls)
        [ DOM.h1 (StyleX.props styles.title) "Playground"
        , DOM.p
            { id: "compile-status"
            , role: "status"
            , "aria-live": "polite"
            , hidden: state.phase `elem` [ "edited", "compiling" ]
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
                { type: "button"
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
        [ -- Native modal behavior keeps focus and interaction inside the sidebar.
          DOM.createBuiltinElement "dialog"
            { id: "package-list"
            , ref: DOM.reactRef packageDialog
            , "aria-label": "Registry packages"
            , className: (StyleX.props styles.sidebar).className
            , onCancel: cancelPackageDialog closePackages
            , onClick: dismissPackageBackdrop closePackages
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
                "Downloaded from the PureScript Registry. Select a package for documentation or its license for notices."
            , DOM.ul
                { ref: DOM.reactRef packageList
                , className: (StyleX.props styles.packages).className
                } $ packages <#> \package ->
                DOM.li { key: package.name, className: (StyleX.props styles.package).className }
                  [ DOM.a
                      { href: package.pursuitUrl
                      , target: targetBlank
                      , rel: "noopener noreferrer"
                      , className: (StyleX.props styles.packageName).className
                      }
                      package.name
                  , DOM.span (StyleX.props styles.version) package.version
                  , DOM.button
                      { type: "button"
                      , className: (StyleX.props styles.licenseButton).className
                      , "data-package-license": package.name
                      , onClick: handler_ do
                          setSelectedPackage (Just package)
                          setShowLicense true
                      }
                      ("License: " <> package.license)
                  ]
            ]
        , DOM.createBuiltinElement "dialog"
            { ref: DOM.reactRef licenseDialog
            , "aria-labelledby": "package-license-title"
            , className: (StyleX.props styles.licenseDialog).className
            , onCancel: cancelPackageDialog closeLicense
            , onClick: dismissPackageBackdrop closeLicense
            , "data-package-license-dialog": "true"
            } $ case selectedPackage of
            Nothing -> []
            Just package ->
              [ DOM.div (StyleX.props styles.licenseHeader)
                  [ DOM.h2
                      { id: "package-license-title"
                      , className: (StyleX.props styles.licenseTitle).className
                      }
                      (package.name <> " " <> package.version)
                  , DOM.button
                      { ref: DOM.reactRef licenseCloseButton
                      , type: "button"
                      , className:
                          (StyleX.props [ controlStyles.control, styles.button, styles.close ]).className
                      , onClick: handler_ closeLicense
                      }
                      "Close"
                  ]
              , DOM.div (StyleX.props styles.licenseContent)
                  ( [ DOM.p (StyleX.props styles.licenseExpression)
                        ("SPDX expression: " <> package.license)
                    , DOM.a
                        { href: package.repositoryUrl
                        , target: targetBlank
                        , rel: "noopener noreferrer"
                        , className: (StyleX.props styles.repositoryLink).className
                        }
                        "Upstream repository"
                    ] <>
                      if null package.notices then
                        [ DOM.p (StyleX.props styles.emptyNotices)
                            "This archive contains no license or notice files. Check the upstream repository."
                        ]
                      else package.notices <#> \notice ->
                        DOM.section
                          { className: (StyleX.props styles.notice).className
                          , "data-package-notice": notice.path
                          }
                          [ DOM.h3 (StyleX.props styles.noticePath) notice.path
                          , DOM.pre (StyleX.props styles.noticeSource) notice.source
                          ]
                  )
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
