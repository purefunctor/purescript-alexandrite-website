module Website.React.Aria.Components.Yoga
  ( button
  , listBox
  , listBoxItem
  , popover
  , select
  , selectValue
  ) where

import Prelude (Unit)

import Effect.Uncurried (EffectFn1)
import Website.React.Aria.Components as Aria
import React.Basic (JSX)
import Yoga.React.DOM (class IsJSX)
import Yoga.React.DOM as DOM

select ::
  forall key children.
  IsJSX children =>
  { "aria-label" :: String
  , selectedKey :: key
  , onSelectionChange :: EffectFn1 key Unit
  , isDisabled :: Boolean
  , className :: String
  } ->
  children ->
  JSX
select = DOM.createElement Aria.select

button :: forall children. IsJSX children => { className :: String } -> children -> JSX
button = DOM.createElement Aria.button

popover ::
  forall children.
  IsJSX children =>
  { className :: String
  , placement :: String
  , offset :: Int
  } ->
  children ->
  JSX
popover = DOM.createElement Aria.popover

listBox :: forall children. IsJSX children => { className :: String } -> children -> JSX
listBox = DOM.createElement Aria.listBox

-- Render-prop children are functions rather than IsJSX values.
selectValue :: {} -> ({ selectedText :: String } -> JSX) -> JSX
selectValue _ children = DOM.createElement_ Aria.selectValue { children }

listBoxItem ::
  forall key.
  { key :: String
  , id :: key
  , textValue :: String
  , className :: { isFocused :: Boolean } -> String
  } ->
  ({ isSelected :: Boolean } -> JSX) ->
  JSX
listBoxItem props children = DOM.createElement_ Aria.listBoxItem
  { key: props.key
  , id: props.id
  , textValue: props.textValue
  , className: props.className
  , children
  }
