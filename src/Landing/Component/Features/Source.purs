module Landing.Component.Features.Source (landingPageSource, editorIntelligenceMedia) where

import Prelude

import Alexandrite.StyleX as StyleX
import Landing.Component.Features.Code as Code
import React.Basic (JSX, ReactComponent, element)
import Yoga.React.DOM as DOM

styles = StyleX.create
  { editorBinding:
      { appearance: "none"
      , backgroundColor: "transparent"
      , borderWidth: 0
      , color: "inherit"
      , cursor: "help"
      , display: "inline-block"
      , font: "inherit"
      , lineHeight: "inherit"
      , margin: 0
      , padding: 0
      , position: "relative"
      , verticalAlign: "baseline"
      , ":focus-visible":
          { outlineColor: "var(--landing-color-crystal)"
          , outlineOffset: 3
          , outlineStyle: "solid"
          , outlineWidth: 2
          }
      }
  , editorTooltip:
      { backgroundColor: "var(--landing-color-surface)"
      , borderColor: "var(--landing-color-line)"
      , borderLeftColor: "var(--landing-color-crystal)"
      , borderStyle: "solid"
      , borderWidth: "1px 1px 1px 3px"
      , boxShadow: "0 12px 28px oklch(22.29% 0.0049 173.9 / 16%)"
      , columnGap: 5
      , display: "grid"
      , fontFamily: "JetBrains Mono Variable, monospace"
      , fontSize: "clamp(0.5rem, 0.9vw, 0.6875rem)"
      , gridTemplateColumns: "auto 1fr"
      , lineHeight: 1.35
      , maxWidth: "min(560px, calc(100vw - 32px))"
      , minWidth: "clamp(100px, 13vw, 148px)"
      , padding: "clamp(5px, 0.8vw, 8px) clamp(7px, 1vw, 10px)"
      , whiteSpace: "pre-wrap"
      , width: "max-content"
      , zIndex: 20
      }
  , editorTooltipKind:
      { color: "var(--landing-color-latte-subtext-1)"
      }
  , editorTooltipSymbol:
      { color: "var(--landing-color-latte-blue)"
      , fontStyle: "italic"
      , fontWeight: 650
      }
  , editorTooltipType:
      { color: "var(--landing-color-latte-text)"
      , gridColumn: "1 / -1"
      }
  }

editorBindingStyle = StyleX.props styles.editorBinding
editorTooltipStyle = StyleX.props styles.editorTooltip
editorTooltipKind = StyleX.props styles.editorTooltipKind
editorTooltipSymbol = StyleX.props styles.editorTooltipSymbol
editorTooltipType = StyleX.props styles.editorTooltipType

foreign import editorHoverBinding
  :: ReactComponent
       { bindingClassName :: String
       , tokenClassName :: String
       , tooltipClassName :: String
       , kindClassName :: String
       , symbolClassName :: String
       , typeClassName :: String
       , kind :: String
       , symbol :: String
       , inferredType :: String
       }

landingPageSource :: JSX
landingPageSource =
  DOM.pre Code.sourcePreview
    [ DOM.code {}
        [ DOM.span Code.sourceLine
            [ DOM.span Code.sourceKeyword "import"
            , DOM.span Code.sourceReference " Yoga.React.DOM"
            , DOM.span Code.sourceKeyword " as"
            , DOM.span Code.sourceReference " DOM"
            ]
        , DOM.span Code.sourceLine " "
        , DOM.span Code.sourceLine
            [ DOM.span Code.sourceDeclaration "component"
            , DOM.span Code.sourceSyntax " :: "
            , DOM.span Code.sourceType "ReactComponent {}"
            ]
        , DOM.span Code.sourceLine
            [ DOM.span Code.sourceDeclaration "component"
            , DOM.span Code.sourceAccent " = "
            , DOM.span Code.sourceReference "unsafePerformEffect "
            , DOM.span Code.sourceKeyword "do"
            ]
        , DOM.span Code.sourceLine
            [ DOM.span {} "  "
            , DOM.span Code.sourceVariable "headerComponent"
            , DOM.span Code.sourceSyntax " <- "
            , DOM.span Code.sourceReference "Header"
            , DOM.span {} ".header"
            ]
        , DOM.span Code.sourceLine
            [ DOM.span {} "  "
            , DOM.span Code.sourceReference "Hooks"
            , DOM.span {} ".reactComponent"
            , DOM.span Code.sourceString """ "LandingPage" """
            , DOM.span Code.sourceAccent """\_ """
            , DOM.span Code.sourceSyntax "-> "
            , DOM.span Code.sourceReference "Hooks"
            , DOM.span {} "."
            , DOM.span Code.sourceKeyword "do"
            ]
        , DOM.span Code.sourceLine
            [ DOM.span {} "    pure "
            , DOM.span Code.sourceAccent "$ "
            , DOM.span Code.sourceReference "DOM"
            , DOM.span {} ".div page"
            ]
        , DOM.span Code.sourceLine
            [ DOM.span {} "      "
            , DOM.span Code.sourceBracket "["
            , DOM.span {} " headerComponent unit"
            ]
        , DOM.span Code.sourceLine
            [ DOM.span {} "      , "
            , DOM.span Code.sourceReference "DOM"
            , DOM.span {} ".main shell"
            ]
        , DOM.span Code.sourceLine
            [ DOM.span {} "          "
            , DOM.span Code.sourceBracket "["
            , DOM.span Code.sourceReference " DOM"
            , DOM.span {} ".div hero"
            ]
        , DOM.span Code.sourceLine
            [ DOM.span {} "              "
            , DOM.span Code.sourceString "["
            , DOM.span Code.sourceReference " DOM"
            , DOM.span {} ".div heroContent"
            ]
        , DOM.span Code.sourceLine
            [ DOM.span {} "                  "
            , DOM.span Code.sourceAccent "["
            , DOM.span Code.sourceReference " DOM"
            , DOM.span {} ".h1 heroTitle"
            ]
        ]
    ]

editorIntelligenceMedia :: JSX
editorIntelligenceMedia =
  DOM.pre Code.editorPreview
    [ DOM.code {}
        [ DOM.span Code.sourceLine
            [ DOM.span Code.sourceComment "-- Inspect the source code with your cursor" ]
        , DOM.span Code.sourceLine
            [ DOM.span Code.sourceKeyword "newtype"
            , DOM.span {} " "
            , editorBinding Code.sourceType "type" "Routine" "Routine :: Type -> Type -> Type"
            , DOM.span {} " "
            , editorBinding Code.sourceType "type variable" "r" "Type"
            , DOM.span {} " "
            , editorBinding Code.sourceType "type variable" "a" "Type"
            , DOM.span Code.sourceAccent " = "
            , editorBinding Code.sourceAccent "constructor" "Routine"
                "Routine :: forall @r @a. ((a -> r) -> r) -> Routine r a"
            , DOM.span Code.sourceBracket " (("
            , editorBinding Code.sourceText "type variable" "a" "Type"
            , DOM.span Code.sourceSyntax " -> "
            , editorBinding Code.sourceText "type variable" "r" "Type"
            , DOM.span Code.sourceBracket ")"
            , DOM.span Code.sourceSyntax " -> "
            , editorBinding Code.sourceText "type variable" "r" "Type"
            , DOM.span Code.sourceBracket ")"
            ]
        , DOM.span Code.sourceLine " "
        , DOM.span Code.sourceLine
            [ editorBinding Code.sourceKeyword "instance" "instance"
                "functorRoutine :: forall r. Functor (Routine r)"
            , DOM.span {} " "
            , editorBinding Code.sourceType "class" "Functor"
                "Functor :: (Type -> Type) -> Constraint"
            , DOM.span Code.sourceBracket " ("
            , editorBinding Code.sourceType "type" "Routine"
                "Routine :: Type -> Type -> Type"
            , DOM.span {} " "
            , editorBinding Code.sourceType "type variable" "r" "Type"
            , DOM.span Code.sourceBracket ")"
            , DOM.span Code.sourceKeyword " where"
            ]
        , DOM.span Code.sourceLine
            [ DOM.span {} "  "
            , editorBinding Code.sourceDeclaration "class member" "map"
                """map ::
  forall (@f :: Type -> Type).
    Functor (f :: Type -> Type) =>
    (forall a b. (a -> b) -> (f :: Type -> Type) a -> (f :: Type -> Type) b)"""
            , DOM.span {} " "
            , editorBinding Code.sourceVariable "parameter" "transform" "a -> b"
            , DOM.span Code.sourceBracket " ("
            , editorBinding Code.sourceAccent "constructor" "Routine"
                "Routine :: forall @r @a. ((a -> r) -> r) -> Routine r a"
            , DOM.span {} " "
            , editorBinding Code.sourceVariable "variable" "routine" "(a -> r) -> r"
            , DOM.span Code.sourceBracket ")"
            , DOM.span Code.sourceAccent " ="
            ]
        , DOM.span Code.sourceLine
            [ DOM.span {} "    "
            , editorBinding Code.sourceAccent "constructor" "Routine"
                "Routine :: forall @r @a. ((a -> r) -> r) -> Routine r a"
            , DOM.span Code.sourceAccent """ \"""
            , editorBinding Code.sourceVariable "parameter" "return" "b -> r"
            , DOM.span Code.sourceSyntax " ->"
            ]
        , DOM.span Code.sourceLine
            [ DOM.span {} "      "
            , editorBinding Code.sourceText "variable" "routine" "(a -> r) -> r"
            , DOM.span Code.sourceAccent """ \"""
            , editorBinding Code.sourceVariable "parameter" "value" "a"
            , DOM.span Code.sourceSyntax " ->"
            ]
        , DOM.span Code.sourceLine
            [ DOM.span {} "        "
            , editorBinding Code.sourceText "parameter" "return" "b -> r"
            , DOM.span Code.sourceBracket " ("
            , editorBinding Code.sourceText "parameter" "transform" "a -> b"
            , DOM.span {} " "
            , editorBinding Code.sourceText "parameter" "value" "a"
            , DOM.span Code.sourceBracket ")"
            ]
        ]
    ]

editorBinding :: StyleX.Props -> String -> String -> String -> JSX
editorBinding tokenStyle kind symbol inferredType =
  element editorHoverBinding
    { bindingClassName: editorBindingStyle.className
    , tokenClassName: tokenStyle.className
    , tooltipClassName: editorTooltipStyle.className
    , kindClassName: editorTooltipKind.className
    , symbolClassName: editorTooltipSymbol.className
    , typeClassName: editorTooltipType.className
    , kind
    , symbol
    , inferredType
    }
