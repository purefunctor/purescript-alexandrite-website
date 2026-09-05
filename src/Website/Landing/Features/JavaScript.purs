module Website.Landing.Features.JavaScript (javascriptOutputMedia) where

import Prelude

import Alexandrite.StyleX as StyleX
import Website.Landing.Features.Code as Code
import React.Basic (JSX)
import Yoga.React.DOM as DOM

foreign import quotedString :: String -> String -> JSX

javascriptExamplesStyles = StyleX.create
  { root:
      { display: "grid"
      , gap: 24
      , minWidth: 0
      , width: "100%"
      }
  , example:
      { color: "var(--landing-color-latte-text)"
      , display: "grid"
      , fontFamily: "JetBrains Mono Variable, monospace"
      , fontSize: 13.5
      , fontVariantLigatures: "none"
      , gap: 40
      , gridTemplateColumns: "repeat(2, minmax(0, 1fr))"
      , lineHeight: 1.25
      , paddingBlockEnd: 20
      , width: "100%"
      , "@media (max-width: 1160px)":
          { gap: 28
          , gridTemplateColumns: "minmax(0, 1fr)"
          }
      , "@media (max-width: 800px)":
          { fontSize: "clamp(11.5px, 3.1vw, 12.5px)"
          , gap: 24
          , paddingBlockEnd: 12
          }
      }
  , exampleTitle:
      { color: "var(--landing-color-ink)"
      , fontFamily: "InterVariable, sans-serif"
      , fontSize: 18
      , fontWeight: 580
      , gridColumn: "1 / -1"
      , letterSpacing: "-0.015em"
      , lineHeight: 1.2
      , margin: 0
      }
  , pane:
      { display: "grid"
      , gap: 12
      , gridTemplateRows: "auto 1fr"
      , minWidth: 0
      , "@media (min-width: 641px) and (max-width: 800px)":
          { paddingInline: 4
          }
      }
  , paneLabel:
      { color: "var(--landing-color-muted)"
      , fontFamily: "InterVariable, sans-serif"
      , fontSize: 12
      , fontWeight: 650
      , letterSpacing: "0.04em"
      }
  , code:
      { color: "inherit"
      , font: "inherit"
      , lineHeight: "inherit"
      , margin: 0
      , minWidth: 0
      , overflowX: "auto"
      , whiteSpace: "pre"
      }
  }

javascriptOutputMedia :: JSX
javascriptOutputMedia =
  DOM.div (StyleX.props javascriptExamplesStyles.root)
    [ javascriptExample "Tail-call optimisation" factorialSource factorialOutput
    , javascriptExample "Effect inlining" effectSource effectOutput
    , javascriptExample "Native StyleX" stylexSource stylexOutput
    ]

javascriptExample :: String -> JSX -> JSX -> JSX
javascriptExample title source output =
  DOM.div (StyleX.props javascriptExamplesStyles.example)
    [ DOM.h4 (StyleX.props javascriptExamplesStyles.exampleTitle) title
    , javascriptPane "PureScript" source
    , javascriptPane "JavaScript" output
    ]

javascriptPane :: String -> JSX -> JSX
javascriptPane label code =
  DOM.div (StyleX.props javascriptExamplesStyles.pane)
    [ DOM.span (StyleX.props javascriptExamplesStyles.paneLabel) label
    , DOM.pre (StyleX.props javascriptExamplesStyles.code) code
    ]

factorialSource :: JSX
factorialSource =
  DOM.code {}
    [ DOM.span Code.sourceLine
        [ DOM.span Code.sourceDeclaration "factorial"
        , DOM.span Code.sourceSyntax " :: "
        , DOM.span Code.sourceType "Int -> Int -> Int"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceDeclaration "factorial"
        , DOM.span {} " value accumulator"
        , DOM.span Code.sourceAccent " ="
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "  if"
        , DOM.span {} " value "
        , DOM.span Code.sourceAccent "=="
        , DOM.span {} " 0"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "  then"
        , DOM.span {} " accumulator"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "  else"
        , DOM.span Code.sourceDeclaration " factorial"
        , DOM.span Code.sourceBracket " ("
        , DOM.span {} "value "
        , DOM.span Code.sourceAccent "-"
        , DOM.span {} " 1"
        , DOM.span Code.sourceBracket ")"
        , DOM.span Code.sourceBracket " ("
        , DOM.span {} "accumulator "
        , DOM.span Code.sourceAccent "*"
        , DOM.span {} " value"
        , DOM.span Code.sourceBracket ")"
        ]
    ]

factorialOutput :: JSX
factorialOutput =
  DOM.code {}
    [ DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "import"
        , DOM.span {} " * "
        , DOM.span Code.sourceKeyword "as"
        , DOM.span Code.sourceReference " Data_Eq"
        , DOM.span Code.sourceKeyword " from"
        , DOM.span Code.sourceString (" " <> quoted "../Data.Eq/index.js" <> ";")
        ]
    , DOM.span Code.sourceLine " "
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "export function"
        , DOM.span Code.sourceDeclaration " factorial"
        , DOM.span Code.sourceBracket "("
        , DOM.span Code.sourceVariable "value"
        , DOM.span Code.sourceBracket ") {"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "  return"
        , DOM.span Code.sourceBracket " ("
        , DOM.span Code.sourceVariable "accumulator"
        , DOM.span Code.sourceBracket ") => {"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "    let"
        , DOM.span Code.sourceVariable " $argument0"
        , DOM.span Code.sourceAccent " = "
        , DOM.span Code.sourceVariable "value"
        , DOM.span {} ";"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "    let"
        , DOM.span Code.sourceVariable " $argument1"
        , DOM.span Code.sourceAccent " = "
        , DOM.span Code.sourceVariable "accumulator"
        , DOM.span {} ";"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "    while"
        , DOM.span Code.sourceBracket " ("
        , DOM.span Code.sourceAccent "true"
        , DOM.span Code.sourceBracket ") {"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "      const"
        , DOM.span Code.sourceVariable " $currentArgument0"
        , DOM.span Code.sourceAccent " = "
        , DOM.span Code.sourceVariable "$argument0"
        , DOM.span {} ";"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "      const"
        , DOM.span Code.sourceVariable " $currentArgument1"
        , DOM.span Code.sourceAccent " = "
        , DOM.span Code.sourceVariable "$argument1"
        , DOM.span {} ";"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "      if"
        , DOM.span Code.sourceBracket " ("
        , DOM.span Code.sourceReference "Data_Eq"
        , DOM.span {} ".eq("
        , DOM.span Code.sourceReference "Data_Eq"
        , DOM.span {} ".eqInt)"
        , DOM.span Code.sourceBracket "($currentArgument0)("
        , DOM.span Code.sourceAccent "0"
        , DOM.span {} " | 0"
        , DOM.span Code.sourceBracket ")) {"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "        return"
        , DOM.span Code.sourceVariable " $currentArgument1"
        , DOM.span {} ";"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceBracket "      }"
        , DOM.span Code.sourceKeyword " else"
        , DOM.span Code.sourceBracket " {"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceVariable "        $argument0"
        , DOM.span Code.sourceAccent " = "
        , DOM.span Code.sourceVariable "$currentArgument0"
        , DOM.span Code.sourceAccent " - "
        , DOM.span Code.sourceBracket "("
        , DOM.span Code.sourceAccent "1"
        , DOM.span {} " | 0"
        , DOM.span Code.sourceBracket ")"
        , DOM.span {} " | 0;"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceVariable "        $argument1"
        , DOM.span Code.sourceAccent " = "
        , DOM.span Code.sourceVariable "$currentArgument1"
        , DOM.span Code.sourceAccent " * "
        , DOM.span Code.sourceVariable "$currentArgument0"
        , DOM.span {} " | 0;"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "        continue"
        , DOM.span {} ";"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceBracket "      }" ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceBracket "    }" ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceBracket "  };" ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceBracket "}" ]
    ]

effectSource :: JSX
effectSource =
  DOM.code {}
    [ DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "import"
        , DOM.span Code.sourceReference " Effect"
        , DOM.span Code.sourceBracket " ("
        , DOM.span Code.sourceType "Effect"
        , DOM.span Code.sourceBracket ")"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "import"
        , DOM.span Code.sourceReference " Effect.Console"
        , DOM.span Code.sourceKeyword " as"
        , DOM.span Code.sourceReference " Console"
        ]
    , DOM.span Code.sourceLine " "
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "foreign import"
        , DOM.span Code.sourceDeclaration " ask"
        , DOM.span Code.sourceSyntax " :: "
        , DOM.span Code.sourceType "String -> Effect String"
        ]
    , DOM.span Code.sourceLine " "
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceDeclaration "conversation"
        , DOM.span Code.sourceSyntax " :: "
        , DOM.span Code.sourceType "Effect Unit"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceDeclaration "conversation"
        , DOM.span Code.sourceAccent " = "
        , DOM.span Code.sourceKeyword "do"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span {} "  "
        , DOM.span Code.sourceReference "Console"
        , DOM.span {} ".log"
        , DOM.span {} " "
        , quotedString Code.sourceString.className "Enter a message"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span {} "  "
        , DOM.span Code.sourceVariable "message"
        , DOM.span Code.sourceSyntax " <- "
        , DOM.span Code.sourceReference "ask"
        , DOM.span {} " "
        , quotedString Code.sourceString.className "> "
        ]
    , DOM.span Code.sourceLine
        [ DOM.span {} "  "
        , DOM.span Code.sourceReference "Console"
        , DOM.span {} ".log"
        , DOM.span {} " message"
        ]
    ]

effectOutput :: JSX
effectOutput =
  DOM.code {}
    [ DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "import"
        , DOM.span {} " * "
        , DOM.span Code.sourceKeyword "as"
        , DOM.span Code.sourceReference " Effect_Console"
        , DOM.span Code.sourceKeyword " from"
        , DOM.span Code.sourceString (" " <> quoted "../Effect.Console/index.js" <> ";")
        ]
    , DOM.span Code.sourceLine " "
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "export const"
        , DOM.span Code.sourceDeclaration " conversation"
        , DOM.span Code.sourceAccent " = "
        , DOM.span Code.sourceBracket "(() => {"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "  const"
        , DOM.span Code.sourceVariable " $action"
        , DOM.span Code.sourceAccent " = "
        , DOM.span Code.sourceReference "Effect_Console"
        , DOM.span {} ".log"
        , DOM.span Code.sourceBracket "("
        , quotedString Code.sourceString.className "Enter a message"
        , DOM.span Code.sourceBracket ");"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "  return"
        , DOM.span Code.sourceBracket " () => {"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "    const"
        , DOM.span Code.sourceVariable " $unit"
        , DOM.span Code.sourceAccent " = "
        , DOM.span Code.sourceVariable "$action"
        , DOM.span Code.sourceBracket "();"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "    const"
        , DOM.span Code.sourceVariable " $action$1"
        , DOM.span Code.sourceAccent " = "
        , DOM.span Code.sourceDeclaration "ask"
        , DOM.span Code.sourceBracket "("
        , quotedString Code.sourceString.className "> "
        , DOM.span Code.sourceBracket ");"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "    const"
        , DOM.span Code.sourceVariable " message"
        , DOM.span Code.sourceAccent " = "
        , DOM.span Code.sourceVariable "$action$1"
        , DOM.span Code.sourceBracket "();"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "    return"
        , DOM.span Code.sourceReference " Effect_Console"
        , DOM.span {} ".log"
        , DOM.span Code.sourceBracket "("
        , DOM.span Code.sourceVariable "message"
        , DOM.span Code.sourceBracket ")();"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceBracket "  };" ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceBracket "})();" ]
    ]

stylexSource :: JSX
stylexSource =
  DOM.code {}
    [ DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "import"
        , DOM.span Code.sourceReference " Alexandrite.StyleX"
        , DOM.span Code.sourceKeyword " as"
        , DOM.span Code.sourceReference " StyleX"
        ]
    , DOM.span Code.sourceLine " "
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceDeclaration "styles"
        , DOM.span Code.sourceAccent " = "
        , DOM.span Code.sourceReference "StyleX"
        , DOM.span {} ".create"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceBracket "  {"
        , DOM.span Code.sourceDeclaration " button"
        , DOM.span {} ":"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceBracket "      {"
        , DOM.span Code.sourceVariable " color"
        , DOM.span {} ": "
        , DOM.span Code.sourceString (quoted "red")
        ]
    , DOM.span Code.sourceLine
        [ DOM.span {} "      , "
        , DOM.span Code.sourceVariable "padding"
        , DOM.span {} ": "
        , DOM.span Code.sourceAccent "8"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span {} "      , "
        , DOM.span Code.sourceString (quoted ":hover")
        , DOM.span {} ": "
        , DOM.span Code.sourceBracket "{"
        , DOM.span Code.sourceVariable " color"
        , DOM.span {} ": "
        , DOM.span Code.sourceString (quoted "blue")
        , DOM.span Code.sourceBracket " }"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceBracket "      }" ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceBracket "  }" ]
    ]

stylexOutput :: JSX
stylexOutput =
  DOM.code {}
    [ DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "import"
        , DOM.span {} " * "
        , DOM.span Code.sourceKeyword "as"
        , DOM.span Code.sourceReference " $stylex"
        , DOM.span Code.sourceKeyword " from"
        , DOM.span Code.sourceString (" " <> quoted "@stylexjs/stylex" <> ";")
        ]
    , DOM.span Code.sourceLine " "
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceKeyword "export const"
        , DOM.span Code.sourceDeclaration " styles"
        , DOM.span Code.sourceAccent " = "
        , DOM.span Code.sourceReference "$stylex"
        , DOM.span {} ".create"
        , DOM.span Code.sourceBracket "({"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceDeclaration "  button"
        , DOM.span {} ": "
        , DOM.span Code.sourceBracket "{"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceVariable "    color"
        , DOM.span {} ": "
        , DOM.span Code.sourceString (quoted "red")
        , DOM.span {} ","
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceVariable "    padding"
        , DOM.span {} ": "
        , DOM.span Code.sourceAccent "8"
        , DOM.span {} " | 0,"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceString ("    " <> quoted ":hover")
        , DOM.span {} ": "
        , DOM.span Code.sourceBracket "{"
        , DOM.span Code.sourceVariable " color"
        , DOM.span {} ": "
        , DOM.span Code.sourceString (quoted "blue")
        , DOM.span Code.sourceBracket " }"
        ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceBracket "  }" ]
    , DOM.span Code.sourceLine
        [ DOM.span Code.sourceBracket "});" ]
    ]

quoted :: String -> String
quoted value = "'" <> value <> "'"
