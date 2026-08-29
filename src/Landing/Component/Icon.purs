module Landing.Component.Icon
  ( IconProps
  , arrowRight
  , bluesky
  , bookOpen
  , checkCircle
  , code
  , copyright
  , database
  , externalLink
  , gitHub
  , menu
  , pureScript
  , shieldCheck
  , x
  ) where

import React.Basic (ReactComponent)

type IconProps =
  { "aria-hidden" :: Boolean
  , focusable :: Boolean
  }

foreign import arrowRight :: ReactComponent IconProps
foreign import bluesky :: ReactComponent IconProps
foreign import bookOpen :: ReactComponent IconProps
foreign import checkCircle :: ReactComponent IconProps
foreign import code :: ReactComponent IconProps
foreign import copyright :: ReactComponent IconProps
foreign import database :: ReactComponent IconProps
foreign import externalLink :: ReactComponent IconProps
foreign import gitHub :: ReactComponent IconProps
foreign import menu :: ReactComponent IconProps
foreign import pureScript :: ReactComponent IconProps
foreign import shieldCheck :: ReactComponent IconProps
foreign import x :: ReactComponent IconProps
