module Landing.Component.Features.Performance (performanceMedia) where

import Prelude

import Alexandrite.StyleX as StyleX
import React.Basic (JSX)
import Yoga.React.DOM as DOM

styles = StyleX.create
  { performanceOutput:
      { color: "var(--landing-color-latte-text)"
      , fontFamily: "JetBrains Mono Variable, monospace"
      , fontSize: 16
      , fontVariantNumeric: "tabular-nums"
      , lineHeight: 1.25
      , margin: 0
      , maxWidth: "100%"
      , overflowX: "auto"
      , padding: 0
      , width: "100%"
      , "@media (max-width: 800px)":
          { fontSize: "clamp(11.5px, 3.1vw, 12.5px)"
          , padding: "12px 0"
          }
      }
  , performanceLine:
      { display: "block"
      }
  , performancePhase:
      { fontWeight: 600
      }
  , performanceBar:
      { color: "var(--landing-color-latte-teal)"
      }
  , performanceFinished:
      { color: "var(--landing-color-latte-green)"
      , fontWeight: 650
      }
  , performanceBarTail:
      { "@media (max-width: 800px)":
          { display: "none"
          }
      }
  }

performanceOutput = StyleX.props styles.performanceOutput
performanceLine = StyleX.props styles.performanceLine
performancePhase = StyleX.props styles.performancePhase
performanceBar = StyleX.props styles.performanceBar
performanceFinished = StyleX.props styles.performanceFinished
performanceBarTail = StyleX.props [ styles.performanceBar, styles.performanceBarTail ]

performanceMedia :: JSX
performanceMedia =
  DOM.pre performanceOutput
    [ DOM.code {}
        [ performanceProgressLine "  Analyse"
        , performanceProgressLine "Elaborate"
        , performanceProgressLine "  Codegen"
        , performanceProgressLine "   Output"
        , DOM.span performanceLine
            [ DOM.span performanceFinished " Finished"
            , DOM.span {} " in 3.08s via 12 jobs"
            ]
        ]
    ]

performanceProgressLine :: String -> JSX
performanceProgressLine label =
  DOM.span performanceLine
    [ DOM.span performancePhase label
    , DOM.span {} " ["
    , DOM.span performanceBar "==================="
    , DOM.span performanceBarTail "===="
    , DOM.span {} "] 7355/7355"
    ]
