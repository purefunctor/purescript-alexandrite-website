module Landing.Component.Features.Code where

import Alexandrite.StyleX as StyleX

styles = StyleX.create
  { preview:
      { color: "var(--landing-color-latte-text)"
      , fontFamily: "JetBrains Mono Variable, monospace"
      , fontSize: 16
      , height: "100%"
      , lineHeight: 1.25
      , margin: 0
      , minWidth: 0
      , overflowX: "auto"
      , overflowY: "hidden"
      , padding: 0
      , whiteSpace: "pre"
      , width: "100%"
      , "@media (max-width: 800px)":
          { fontSize: "clamp(11.5px, 3.1vw, 12.5px)"
          , padding: "12px 0"
          }
      }
  , sourcePreview:
      { "WebkitMaskImage": "linear-gradient(to bottom, black 0%, black 42%, transparent 100%)"
      , maskImage: "linear-gradient(to bottom, black 0%, black 42%, transparent 100%)"
      , "@media (max-width: 800px)":
          { height: "auto"
          }
      }
  , editorPreview:
      { "@media (max-width: 800px)":
          { height: "auto"
          }
      }
  , sourceLine:
      { display: "block"
      }
  , sourceKeyword:
      { color: "var(--landing-color-latte-mauve)"
      , fontWeight: 650
      }
  , sourceReference:
      { color: "var(--landing-color-latte-yellow)"
      }
  , sourceSyntax:
      { color: "var(--landing-color-latte-mauve)"
      }
  , sourceDeclaration:
      { color: "var(--landing-color-latte-blue)"
      , fontStyle: "italic"
      }
  , sourceType:
      { color: "var(--landing-color-latte-yellow)"
      , fontStyle: "italic"
      }
  , sourceVariable:
      { color: "var(--landing-color-latte-red)"
      , fontStyle: "italic"
      }
  , sourceString:
      { color: "var(--landing-color-latte-green)"
      }
  , sourceAccent:
      { color: "var(--landing-color-latte-teal)"
      }
  , sourceBracket:
      { color: "var(--landing-color-latte-red)"
      }
  , sourceText:
      { color: "var(--landing-color-latte-text)"
      }
  , sourceComment:
      { color: "var(--landing-color-latte-subtext-1)"
      }
  }

sourcePreview = StyleX.props [ styles.preview, styles.sourcePreview ]
editorPreview = StyleX.props [ styles.preview, styles.editorPreview ]
sourceLine = StyleX.props styles.sourceLine
sourceKeyword = StyleX.props styles.sourceKeyword
sourceReference = StyleX.props styles.sourceReference
sourceSyntax = StyleX.props styles.sourceSyntax
sourceDeclaration = StyleX.props styles.sourceDeclaration
sourceType = StyleX.props styles.sourceType
sourceVariable = StyleX.props styles.sourceVariable
sourceString = StyleX.props styles.sourceString
sourceAccent = StyleX.props styles.sourceAccent
sourceBracket = StyleX.props styles.sourceBracket
sourceText = StyleX.props styles.sourceText
sourceComment = StyleX.props styles.sourceComment
