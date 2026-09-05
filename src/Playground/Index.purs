module Playground.Index (component) where

import React.Basic (ReactComponent)

-- Monaco and the compiler worker own their browser-only lifecycles in the FFI.
foreign import component :: ReactComponent {}
