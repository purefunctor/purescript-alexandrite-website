module Website.Components.Header.Styles (controlStyles) where

import Alexandrite.StyleX as StyleX

-- Shared by navigation links and the playground's header controls.
controlStyles = StyleX.create
  { control:
      { fontFamily: "InterVariable, sans-serif"
      , fontSize: 12
      , fontWeight: 400
      , letterSpacing: "normal"
      , minHeight: 32
      , paddingBlock: 0
      , paddingInline: 12
      , borderRadius: 999
      }
  }
