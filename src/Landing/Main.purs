module Landing.Main where

import Prelude

import Data.Foldable (traverse_)
import Effect (Effect)
import Landing.Index (landingPage)
import Web.DOM.NonElementParentNode (getElementById)
import Web.HTML (window)
import Web.HTML.HTMLDocument (toNonElementParentNode)
import Web.HTML.Window (document)
import Yoga.React.DOM.Client (createRoot, renderRoot)

foreign import configurePlatformStyles :: Effect Unit

main :: Effect Unit
main = do
  configurePlatformStyles
  pageComponent <- landingPage
  container <- window >>= document <#> toNonElementParentNode >>= getElementById "root"
  traverse_ (mount pageComponent) container
  where
  mount pageComponent element = do
    root <- createRoot element
    renderRoot root (pageComponent unit)
