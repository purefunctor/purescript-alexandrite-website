module Playground.Result (component, Outputs, Toolbar) where

import Prelude

import Alexandrite.StyleX as StyleX
import Data.Maybe (Maybe(..), isJust, maybe)
import Data.Nullable (Nullable, toMaybe)
import Data.Nullable as Nullable
import Effect (Effect)
import Effect.Unsafe (unsafePerformEffect)
import React.Basic (JSX, ReactComponent, Ref, element, fragment)
import React.Basic.Events (handler_)
import React.Basic.Hooks ((/\))
import React.Basic.Hooks as Hooks
import Unsafe.Reference (UnsafeRefEq(..))
import Web.DOM.Element (Element)
import Yoga.React.DOM as DOM

type Outputs = Nullable (Array { path :: String, source :: String })
type Toolbar = Nullable Element
type Props = { outputs :: Outputs, phase :: String, toolbar :: Toolbar }
type Run = { id :: Int, entry :: String, files :: Array { path :: String, source :: String } }

foreign import portal :: Toolbar -> JSX -> JSX
foreign import loaderIcon :: ReactComponent { "aria-hidden" :: Boolean, className :: String }
foreign import prepareRuntime ::
  { outputs :: Outputs
  , generation :: Ref Int
  , onRun :: Nullable Run -> Effect Unit
  , onPreparing :: Boolean -> Effect Unit
  , onExecuting :: Boolean -> Effect Unit
  , onMessage :: String -> Effect Unit
  } ->
  Effect Unit

foreign import observeExecution ::
  { run :: Run
  , iframe :: Ref (Nullable Element)
  , onRun :: Nullable Run -> Effect Unit
  , onExecuting :: Boolean -> Effect Unit
  , onMessage :: String -> Effect Unit
  } ->
  Effect (Effect Unit)

foreign import executeFrame :: Ref (Nullable Element) -> Run -> Effect Unit

spin = StyleX.keyframes
  { from: { transform: "rotate(0deg)" }
  , to: { transform: "rotate(360deg)" }
  }

styles = StyleX.create
  { panel: { height: "100%", display: "flex", flexDirection: "column" }
  , progress:
      { minWidth: 56, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }
  , spinner:
      { width: 18
      , height: 18
      , color: "var(--landing-color-ink)"
      , animationName: spin
      , animationDuration: "800ms"
      , animationTimingFunction: "linear"
      , animationIterationCount: "infinite"
      , animationPlayState:
          { default: "running", "@media (prefers-reduced-motion: reduce)": "paused" }
      }
  , button:
      { backgroundColor:
          { default: "var(--playground-color-action)"
          , ":hover": "var(--playground-color-action-hover)"
          }
      , borderRadius: 999
      , paddingInline: 10
      , minHeight: 32
      , fontSize: 12
      , cursor: "var(--landing-interactive-cursor, pointer)"
      , ":focus-visible": { outline: "2px solid var(--landing-color-crystal)", outlineOffset: 2 }
      , ":disabled": { opacity: 0.5, cursor: "default" }
      }
  , message:
      { fontSize: 12, padding: 12, overflowWrap: "anywhere", color: "var(--landing-color-muted)" }
  , frame: { borderWidth: 0, width: "100%", flexGrow: 1, minHeight: 0 }
  }

component :: ReactComponent Props
component = unsafePerformEffect $ Hooks.reactComponent "PlaygroundRuntime" \props -> Hooks.do
  iframe <- Hooks.useRef Nullable.null
  generation <- Hooks.useRef 0
  run /\ setRun <- Hooks.useState' Nullable.null
  preparing /\ setPreparing <- Hooks.useState' false
  executing /\ setExecuting <- Hooks.useState' false
  message /\ setMessage <- Hooks.useState' ""
  let
    invalidate = Hooks.readRef generation >>= \id -> Hooks.writeRef generation (id + 1)
    start = prepareRuntime
      { outputs: props.outputs
      , generation
      , onRun: setRun
      , onPreparing: setPreparing
      , onExecuting: setExecuting
      , onMessage: setMessage
      }
    stop = do
      invalidate
      setRun Nullable.null
      setExecuting false
      setMessage "Program stopped."
    progress
      | props.phase == "loading" = Just "Loading compiler"
      | props.phase == "edited" || props.phase == "compiling" = Just "Compiling"
      | preparing = Just "Preparing runtime"
      | executing = Just "Running program"
      | otherwise = Nothing

  -- Preserve React's reference-based dependencies for compiler output and runs.
  Hooks.useEffect (UnsafeRefEq props.outputs) do
    invalidate
    setRun Nullable.null
    setPreparing false
    setExecuting false
    setMessage ""
    when (isJust (toMaybe props.outputs)) start
    pure invalidate
  Hooks.useEffect (UnsafeRefEq run) $ case toMaybe run of
    Nothing -> pure (pure unit)
    Just execution -> observeExecution
      { run: execution, iframe, onRun: setRun, onExecuting: setExecuting, onMessage: setMessage }

  pure $ DOM.div
    { "data-runtime-ready": isJust (toMaybe run) && not executing && message == ""
    , className: (StyleX.props styles.panel).className
    }
    [ if message /= "" || props.phase == "errors" then
        DOM.p { role: "status", className: (StyleX.props styles.message).className }
          (if props.phase == "errors" then "Compilation failed" else message)
      else mempty
    , portal props.toolbar $ fragment
        [ case progress of
            Just label -> DOM.div
              { role: "status"
              , "aria-label": label
              , className: (StyleX.props styles.progress).className
              }
              [ element loaderIcon
                  { "aria-hidden": true, className: (StyleX.props styles.spinner).className }
              ]
            Nothing -> DOM.button
              { type: "button"
              , className: (StyleX.props styles.button).className
              , disabled: not (isJust (toMaybe props.outputs)) || preparing
              , onClick: handler_ start
              }
              "Restart"
        , if isJust (toMaybe run) then
            DOM.button
              { type: "button"
              , className: (StyleX.props styles.button).className
              , onClick: handler_ stop
              }
              "Stop"
          else mempty
        ]
    , toMaybe run # maybe mempty \execution ->
        -- Yoga's iframe attributes do not yet include referrerPolicy.
        DOM.createBuiltinElement_ "iframe"
          { key: show execution.id
          , ref: DOM.reactRef iframe
          , title: "JavaScript result"
          , sandbox: "allow-scripts"
          , referrerPolicy: "no-referrer"
          , src: "/playground-sandbox.html"
          , className: (StyleX.props styles.frame).className
          , onLoad: handler_ (executeFrame iframe execution)
          }
    ]
