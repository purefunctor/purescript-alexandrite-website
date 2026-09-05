module Website.Landing.Features (featuresSection) where

import Prelude

import Alexandrite.StyleX as StyleX
import Data.Maybe (Maybe(..), maybe)
import Website.Landing.Features.JavaScript (javascriptOutputMedia)
import Website.Landing.Features.Performance (performanceMedia)
import Website.Landing.Features.Source (editorIntelligenceMedia, landingPageSource)
import React.Basic (JSX, empty)
import Yoga.React.DOM as DOM

styles = StyleX.create
  { features:
      { paddingBlock: "96px 128px"
      , "@media (max-width: 800px)":
          { paddingBlock: "72px 96px"
          }
      }
  , featuresTitle:
      { fontSize: "clamp(2.5rem, 5vw, 4.5rem)"
      , fontWeight: 520
      , letterSpacing: "-0.045em"
      , lineHeight: 0.98
      , marginBottom: "clamp(72px, 8vw, 96px)"
      }
  , featureList:
      { display: "flex"
      , flexDirection: "column"
      , gap: "clamp(72px, 8vw, 96px)"
      , listStyle: "none"
      , padding: 0
      , "@media (max-width: 800px)":
          { gap: 56
          }
      }
  , featureCopyGroup:
      { display: "grid"
      , gap: 12
      }
  , featureTitle:
      { cursor: "text"
      , fontSize: "clamp(1.4rem, 2.5vw, 2rem)"
      , fontWeight: 580
      , letterSpacing: "-0.025em"
      , lineHeight: 1.1
      , ":focus-visible":
          { outlineColor: "var(--landing-color-mineral)"
          , outlineOffset: 4
          , outlineStyle: "solid"
          , outlineWidth: 2
          }
      }
  , featureCopy:
      { color: "var(--landing-color-muted)"
      , cursor: "text"
      , fontSize: 16
      , lineHeight: 1.65
      , ":focus-visible":
          { outlineColor: "var(--landing-color-mineral)"
          , outlineOffset: 4
          , outlineStyle: "solid"
          , outlineWidth: 2
          }
      }
  , featureItem:
      { alignItems: "start"
      , columnGap: "clamp(40px, 7vw, 88px)"
      , display: "grid"
      , gridTemplateColumns:
          { default: "repeat(2, minmax(0, 1fr))"
          , "@media (max-width: 800px)": "minmax(0, 1fr)"
          }
      , rowGap: 28
      }
  , featureItemVertical:
      { rowGap:
          { default: 48
          , "@media (max-width: 800px)": 28
          }
      }
  , featureMedia:
      { backgroundColor: "var(--landing-color-white-translucent)"
      , display: "grid"
      , minWidth: 0
      , placeItems: "stretch"
      , width: "100%"
      }
  , featureMediaFramed:
      { aspectRatio:
          { default: "16 / 9"
          , "@media (max-width: 800px)": "auto"
          }
      }
  , featureMediaClipped:
      { overflow: "hidden"
      }
  , featureMediaEditor:
      { overflow: "visible"
      , position: "relative"
      }
  , featureMediaVertical:
      { gridColumn: "1 / -1"
      , overflow: "hidden"
      }
  , featureContent:
      { display: "grid"
      , gap: 20
      , minWidth: 0
      }
  }

features = StyleX.props styles.features
featuresTitle = StyleX.props styles.featuresTitle
featureList = StyleX.props styles.featureList
featureCopyGroup = StyleX.props styles.featureCopyGroup
featureTitle = StyleX.props styles.featureTitle
featureCopy = StyleX.props styles.featureCopy

featureItemStyle vertical = StyleX.props
  [ styles.featureItem
  , StyleX.conditional vertical styles.featureItemVertical
  ]

featureMediaLight = StyleX.props [ styles.featureMedia, styles.featureMediaClipped ]
featureMediaSource = StyleX.props
  [ styles.featureMedia, styles.featureMediaFramed, styles.featureMediaClipped ]

featureMediaEditor = StyleX.props
  [ styles.featureMedia, styles.featureMediaFramed, styles.featureMediaEditor ]

featureMediaVertical = StyleX.props [ styles.featureMedia, styles.featureMediaVertical ]
featureContent = StyleX.props styles.featureContent

type Feature =
  { media :: JSX
  , mediaStyle :: StyleX.Props
  , title :: String
  , description :: String
  , details :: Maybe String
  , vertical :: Boolean
  }

featuresSection :: JSX
featuresSection =
  DOM.div { className: features.className, id: "features" }
    [ DOM.h2 featuresTitle "Features"
    , DOM.ul featureList
        [ feature
            { media: landingPageSource
            , mediaStyle: featureMediaSource
            , title: "A modern PureScript experience"
            , description:
                "Alexandrite pushes PureScript development towards the frontier. Experience rich editor tooling and instant builds for existing PureScript libraries and projects."
            , details: Nothing
            , vertical: false
            }
        , feature
            { media: editorIntelligenceMedia
            , mediaStyle: featureMediaEditor
            , title: "Rich editor intelligence"
            , description:
                "Completion, go to definition, hover information, find references, symbol search, conflict-aware renaming, and diagnostics for editors that support the Language Server Protocol."
            , details: Nothing
            , vertical: false
            }
        , feature
            { media: performanceMedia
            , mediaStyle: featureMediaLight
            , title: "Performance that scales"
            , description:
                "The compiler processes thousands of modules in seconds, keeping builds fast as your project and its dependencies grow. This is made possible by the embarrassingly parallel query computation engine."
            , details: Nothing
            , vertical: false
            }
        , feature
            { media: javascriptOutputMedia
            , mediaStyle: featureMediaVertical
            , title: "Readable JavaScript output"
            , description:
                "Alexandrite generates modern JavaScript while optimising PureScript abstractions. Function composition is inlined, newtypes disappear at runtime, Effect abstractions become direct calls, and tail recursion becomes iteration."
            , details: Just
                "StyleX and JSX foreign module integration make it easy to build with modern JavaScript toolchains."
            , vertical: true
            }
        ]
    ]

feature :: Feature -> JSX
feature spec =
  DOM.li (featureItemStyle spec.vertical)
    [ DOM.div featureContent
        [ DOM.h3
            { className: featureTitle.className
            , contentEditable: true
            , suppressContentEditableWarning: true
            }
            spec.title
        , DOM.div featureCopyGroup
            [ featureParagraph spec.description
            , maybe empty featureParagraph spec.details
            ]
        ]
    , DOM.div spec.mediaStyle
        [ spec.media ]
    ]

featureParagraph :: String -> JSX
featureParagraph copy =
  DOM.p
    { className: featureCopy.className
    , contentEditable: true
    , suppressContentEditableWarning: true
    }
    copy
