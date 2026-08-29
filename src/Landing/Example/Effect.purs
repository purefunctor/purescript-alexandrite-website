module Landing.Example.Effect where

import Prelude

import Effect (Effect)
import Effect.Console as Console

foreign import ask :: String -> Effect String

conversation :: Effect Unit
conversation = do
  Console.log "Enter a message"
  message <- ask "> "
  Console.log message
