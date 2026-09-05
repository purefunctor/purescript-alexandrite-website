module Website.Playground.ExampleSelect (component) where

import Prelude

import Alexandrite.StyleX as StyleX
import Data.Array (mapWithIndex)
import Effect (Effect)
import Effect.Uncurried (mkEffectFn1)
import Effect.Unsafe (unsafePerformEffect)
import React.Basic (ReactComponent, element, fragment)
import React.Basic.Hooks as Hooks
import Website.React.Aria.Components.Yoga as Aria
import Yoga.React.DOM as DOM

foreign import examples :: Array { name :: String }

type IconProps =
  { "aria-hidden" :: Boolean
  , focusable :: Boolean
  , width :: Int
  , height :: Int
  , strokeWidth :: Int
  , opacity :: Number
  }

foreign import chevron :: ReactComponent IconProps
foreign import check :: ReactComponent IconProps

styles = StyleX.create
  { root: { maxWidth: "100%" }
  , trigger:
      { fontFamily: "inherit"
      , fontSize: 12
      , fontWeight: 550
      , minHeight: 36
      , maxWidth: "100%"
      , display: "flex"
      , alignItems: "center"
      , justifyContent: "space-between"
      , gap: 20
      , paddingInline: 16
      , borderWidth: 0
      , borderRadius: 999
      , backgroundColor:
          { default: "var(--playground-color-action)"
          , ":hover": "var(--playground-color-action-hover)"
          }
      , color: "var(--landing-color-ink)"
      , cursor: "var(--landing-interactive-cursor, pointer)"
      , ":disabled": { opacity: 0.55 }
      , ":focus-visible": { outline: "2px solid var(--landing-color-crystal)", outlineOffset: 2 }
      }
  , popover:
      { backgroundColor: "var(--landing-color-surface)"
      , color: "var(--landing-color-ink)"
      , borderRadius: 12
      , padding: 4
      , minWidth: "var(--trigger-width)"
      , maxWidth: "calc(100vw - 24px)"
      , boxShadow: "0 4px 20px var(--playground-color-action-hover)"
      }
  , list: { outline: "none", maxHeight: "inherit", overflowY: "auto" }
  , option:
      { display: "flex"
      , alignItems: "center"
      , justifyContent: "space-between"
      , gap: 20
      , minHeight: 40
      , paddingInline: 12
      , fontSize: 12
      , fontWeight: 550
      , borderRadius: 8
      , outline: "none"
      , cursor: "var(--landing-interactive-cursor, pointer)"
      }
  , focusedOption: { backgroundColor: "var(--playground-color-action)" }
  }

component :: ReactComponent { value :: Int, disabled :: Boolean, onChange :: Int -> Effect Unit }
component = unsafePerformEffect $ Hooks.reactComponent "ExampleSelect" \props -> Hooks.do
  pure $ Aria.select
    { "aria-label": "Example"
    , selectedKey: props.value
    , isDisabled: props.disabled
    , onSelectionChange: mkEffectFn1 props.onChange
    , className: (StyleX.props styles.root).className
    }
    [ Aria.button (StyleX.props styles.trigger)
        [ Aria.selectValue {} (\value -> DOM.text value.selectedText)
        , element chevron
            { "aria-hidden": true
            , focusable: false
            , width: 16
            , height: 16
            , strokeWidth: 2
            , opacity: 1.0
            }
        ]
    , Aria.popover
        { className: (StyleX.props styles.popover).className
        , placement: "bottom start"
        , offset: 6
        }
        ( Aria.listBox (StyleX.props styles.list) $
            mapWithIndex
              ( \index example -> Aria.listBoxItem
                  { key: show index
                  , id: index
                  , textValue: example.name
                  , className: \option ->
                      ( StyleX.props
                          [ styles.option
                          , StyleX.conditional option.isFocused styles.focusedOption
                          ]
                      ).className
                  }
                  ( \option -> fragment
                      [ DOM.text example.name
                      , element check
                          { "aria-hidden": true
                          , focusable: false
                          , width: 16
                          , height: 16
                          , strokeWidth: 2
                          , opacity: if option.isSelected then 1.0 else 0.0
                          }
                      ]
                  )
              )
              examples
        )
    ]
