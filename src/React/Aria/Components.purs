module React.Aria.Components
  ( button
  , listBox
  , listBoxItem
  , popover
  , select
  , selectValue
  ) where

import Prelude (Unit)

import Effect.Uncurried (EffectFn1)
import React.Basic (JSX, ReactComponent)
import React.Basic.Hooks (ReactChildren)

foreign import select ::
  forall key.
  ReactComponent
    { "aria-label" :: String
    , selectedKey :: key
    , onSelectionChange :: EffectFn1 key Unit
    , isDisabled :: Boolean
    , className :: String
    , children :: ReactChildren JSX
    }

foreign import button ::
  ReactComponent
    { className :: String
    , children :: ReactChildren JSX
    }

foreign import selectValue ::
  ReactComponent
    { children :: { selectedText :: String } -> JSX
    }

foreign import popover ::
  ReactComponent
    { className :: String
    , placement :: String
    , offset :: Int
    , children :: ReactChildren JSX
    }

foreign import listBox ::
  ReactComponent
    { className :: String
    , children :: ReactChildren JSX
    }

foreign import listBoxItem ::
  forall key.
  ReactComponent
    { key :: String
    , id :: key
    , textValue :: String
    , className :: { isFocused :: Boolean } -> String
    , children :: { isSelected :: Boolean } -> JSX
    }
