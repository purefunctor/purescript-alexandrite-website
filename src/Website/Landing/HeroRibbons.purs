module Website.Landing.HeroRibbons (heroRibbons, separatorRibbons) where

import Alexandrite.StyleX as StyleX
import React.Basic (JSX, ReactComponent, element)

foreign import heroRibbonsImpl ::
  ReactComponent
    { ribbonsClassName :: String
    , ribbon1ClassName :: String
    , ribbon2ClassName :: String
    , ribbon3ClassName :: String
    , ribbon4ClassName :: String
    , ribbon5ClassName :: String
    }

styles = StyleX.create
  { ribbonCanvas:
      { height: "clamp(180px, 22vw, 260px)"
      , maxWidth: "none"
      , pointerEvents: "none"
      , width: "100%"
      , "@media (max-width: 800px)": { height: 150 }
      }
  , heroPlacement:
      { insetBlockEnd: 24
      , insetInlineStart: 0
      , position: "absolute"
      , zIndex: 0
      , "@media (max-width: 800px)": { insetBlockEnd: 18 }
      }
  , separatorPlacement: { position: "relative" }
  , ribbon:
      { fill: "none"
      , strokeLinejoin: "round"
      , strokeWidth: { default: 10, "@media (max-width: 800px)": 6 }
      , vectorEffect: "non-scaling-stroke"
      }
  , ribbon1: { stroke: "var(--landing-color-ribbon-1)" }
  , ribbon2: { stroke: "var(--landing-color-ribbon-2)" }
  , ribbon3: { stroke: "var(--landing-color-ribbon-3)" }
  , ribbon4: { stroke: "var(--landing-color-ribbon-4)" }
  , ribbon5: { stroke: "var(--landing-color-ribbon-5)" }
  }

heroRibbons :: JSX
heroRibbons = ribbons (StyleX.props [ styles.ribbonCanvas, styles.heroPlacement ]).className

separatorRibbons :: JSX
separatorRibbons = ribbons
  (StyleX.props [ styles.ribbonCanvas, styles.separatorPlacement ]).className

ribbons :: String -> JSX
ribbons ribbonsClassName = element heroRibbonsImpl
  { ribbonsClassName
  , ribbon1ClassName: (StyleX.props [ styles.ribbon, styles.ribbon1 ]).className
  , ribbon2ClassName: (StyleX.props [ styles.ribbon, styles.ribbon2 ]).className
  , ribbon3ClassName: (StyleX.props [ styles.ribbon, styles.ribbon3 ]).className
  , ribbon4ClassName: (StyleX.props [ styles.ribbon, styles.ribbon4 ]).className
  , ribbon5ClassName: (StyleX.props [ styles.ribbon, styles.ribbon5 ]).className
  }
