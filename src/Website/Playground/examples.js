export const examples = [
  {
    name: "Hello, Alexandrite",
    source: `module Main where

import Prelude
import Effect (Effect)
import Effect.Console (log)

greet :: String -> String
greet name = "Hello, " <> name <> "!"

square :: Int -> Int
square n = n * n

main :: Effect Unit
main = do
  log (greet "Alexandrite")
  log (show (square 7))
`,
  },
  {
    name: "React counter",
    source: `module Main where

import Prelude
import Data.Tuple.Nested ((/\\))
import Effect (Effect)
import React.Basic (JSX)
import React.Basic.Hooks as React

styles =
  { panel:
      { display: "flex"
      , flexDirection: "column"
      , alignItems: "start"
      , gap: 16
      , padding: 24
      , fontFamily: "system-ui, sans-serif"
      , backgroundColor: "oklch(95% 0.03 155)"
      , color: "oklch(25% 0.03 155)"
      }
  , value: { fontSize: 48, fontWeight: 650 }
  , actions: { display: "flex", gap: 8 }
  , button:
      { backgroundColor: "oklch(32% 0.07 155)"
      , color: "oklch(98% 0.01 155)"
      , borderWidth: 0
      , borderRadius: 999
      , padding: "12px 20px"
      , fontSize: 14
      }
  }

main :: Effect Unit
main = do
  counter <- React.component "Counter" \\_ -> React.do
    count /\\ setCount <- React.useState 0
    pure $ div { style: styles.panel }
      [ text "React counter"
      , div { style: styles.value } [ text (show count) ]
      , div { style: styles.actions }
          [ button { style: styles.button } (setCount (_ - 1)) "−"
          , button { style: styles.button } (setCount (_ + 1)) "+"
          , button { style: styles.button } (setCount (const 0)) "Reset"
          ]
      ]
  mount (counter {})

-- These DOM helpers are supplied by this example's JavaScript FFI.
foreign import div :: forall props. { | props } -> Array JSX -> JSX
foreign import button :: forall props. { | props } -> Effect Unit -> String -> JSX
foreign import text :: String -> JSX
foreign import mount :: JSX -> Effect Unit
`,
    files: [
      {
        path: "Main.js",
        source: `import React from "react";
import ReactDOM from "react-dom/client";
export const div = props => children => React.createElement("div", props, ...children);
export const button = props => onClick => label => React.createElement("button", {...props, type: "button", onClick}, label);
export const text = value => value;
export const mount = element => () => ReactDOM.createRoot(document.getElementById("root")).render(element);
`,
      },
    ],
  },
  {
    name: "Array transformations",
    source: `module Main where

import Prelude
import Data.Array (filter, range)
import Data.Foldable (sum)
import Effect (Effect)
import Effect.Console (log)

main :: Effect Unit
main = do
  let numbers = range 1 10
  let squares = map (\\n -> n * n) numbers
  let evens = filter (\\n -> n \u0060mod\u0060 2 == 0) squares
  log ("Even squares: " <> show evens)
  log ("Sum: " <> show (sum evens))
`,
  },
];
