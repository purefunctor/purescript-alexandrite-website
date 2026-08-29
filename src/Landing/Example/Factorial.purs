module Landing.Example.Factorial where

import Prelude

factorial :: Int -> Int -> Int
factorial value accumulator =
  if value == 0 then accumulator
  else factorial (value - 1) (accumulator * value)
