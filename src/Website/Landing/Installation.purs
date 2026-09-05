module Website.Landing.Installation (installationSection) where

import Alexandrite.StyleX as StyleX
import Website.Components.ContentShell as ContentShell
import React.Basic (JSX, ReactComponent, element)
import Yoga.React.DOM as DOM

foreign import installationCommandsImpl ::
  ReactComponent
    { commandClassName :: String
    , copyButtonClassName :: String
    , copyButtonVisibleClassName :: String
    , promptClassName :: String
    , rootClassName :: String
    , tabClassName :: String
    , tabListClassName :: String
    , terminalClassName :: String
    , tooltipClassName :: String
    }

styles = StyleX.create
  { section:
      { backgroundColor: "var(--landing-color-paper)"
      , color: "var(--landing-color-ink)"
      , width: "100%"
      }
  , content:
      { alignItems: "start"
      , display: "grid"
      , paddingBlock: "96px 64px"
      , rowGap: 28
      , "@media (max-width: 800px)":
          { paddingBlock: "72px 52px"
          }
      }
  , title:
      { fontSize: "clamp(2.5rem, 5vw, 4.5rem)"
      , fontWeight: 520
      , letterSpacing: "-0.045em"
      , lineHeight: 0.98
      }
  , commands:
      { display: "grid"
      , gap: 12
      , minWidth: 0
      }
  , tabList:
      { display: "flex"
      , gap: 8
      }
  , tab:
      { alignItems: "center"
      , backgroundColor:
          { default: "transparent"
          , ":hover": "oklch(from var(--landing-color-ink) l c h / 7%)"
          , "[data-selected]": "oklch(from var(--landing-color-ink) l c h / 10%)"
          }
      , borderColor:
          { default: "oklch(from var(--landing-color-ink) l c h / 16%)"
          , ":hover": "oklch(from var(--landing-color-ink) l c h / 34%)"
          , "[data-selected]": "var(--landing-color-ink)"
          }
      , borderRadius: 999
      , borderStyle: "solid"
      , borderWidth: 1
      , color: "var(--landing-color-ink)"
      , cursor: "default"
      , display: "inline-flex"
      , height: 44
      , justifyContent: "center"
      , padding: 0
      , transition: "background-color 160ms ease, border-color 160ms ease"
      , width: 44
      , ":focus-visible":
          { outlineColor: "var(--landing-color-crystal)"
          , outlineOffset: 3
          , outlineStyle: "solid"
          , outlineWidth: 2
          }
      }
  , command:
      { alignItems: "center"
      , display: "grid"
      , gap: 12
      , gridTemplateColumns: "minmax(0, 1fr) 36px"
      , height: 36
      , maxWidth: "100%"
      , minWidth: 0
      , width: "fit-content"
      }
  , terminal:
      { color: "var(--landing-color-ink)"
      , fontFamily: "JetBrains Mono Variable, monospace"
      , fontSize: 14
      , lineHeight: "20px"
      , minWidth: 0
      , overflowX: "auto"
      , padding: 0
      , whiteSpace: "pre"
      , width: "100%"
      , "@media (max-width: 800px)":
          { fontSize: 12
          , lineHeight: "18px"
          }
      }
  , prompt:
      { color: "var(--landing-color-mineral)"
      }
  , copyButton:
      { alignItems: "center"
      , backgroundColor:
          { default: "oklch(from var(--landing-color-ink) l c h / 7%)"
          , ":hover": "oklch(from var(--landing-color-ink) l c h / 13%)"
          }
      , borderRadius: 999
      , color: "var(--landing-color-ink)"
      , display: "inline-flex"
      , height: 36
      , justifyContent: "center"
      , opacity: 0
      , transform: "translateY(3px)"
      , transition: "background-color 160ms ease, opacity 160ms ease, transform 160ms ease"
      , width: 36
      , "@media (pointer: coarse)":
          { opacity: 1
          , transform: "none"
          }
      , "@media (max-width: 800px)":
          { opacity: 1
          , transform: "none"
          }
      , ":focus-visible":
          { outlineColor: "var(--landing-color-crystal)"
          , outlineOffset: 3
          , outlineStyle: "solid"
          , outlineWidth: 2
          }
      }
  , copyButtonVisible:
      { opacity: 1
      , transform: "none"
      }
  , tooltip:
      { backgroundColor: "var(--landing-color-mineral)"
      , borderRadius: 999
      , color: "var(--landing-color-paper)"
      , fontSize: 12
      , fontWeight: 600
      , opacity:
          { default: 1
          , "[data-entering]": 0
          , "[data-exiting]": 0
          }
      , padding: "6px 10px"
      , transform:
          { default: "none"
          , "[data-entering]": "translateY(4px) scale(0.92)"
          , "[data-exiting]": "translateY(2px) scale(0.96)"
          }
      , transformOrigin: "bottom center"
      , transition: "opacity 160ms ease, transform 180ms cubic-bezier(0.16, 1, 0.3, 1)"
      , "@media (prefers-reduced-motion: reduce)":
          { transitionDuration: "0ms"
          }
      }
  }

installationSection :: JSX
installationSection =
  DOM.section (StyleX.props styles.section)
    [ DOM.div ContentShell.contentShell
        [ DOM.div (StyleX.props styles.content)
            [ DOM.h2 (StyleX.props styles.title) "Install Alexandrite"
            , element installationCommandsImpl
                { commandClassName: (StyleX.props styles.command).className
                , copyButtonClassName: (StyleX.props styles.copyButton).className
                , copyButtonVisibleClassName: (StyleX.props styles.copyButtonVisible).className
                , promptClassName: (StyleX.props styles.prompt).className
                , rootClassName: (StyleX.props styles.commands).className
                , tabClassName: (StyleX.props styles.tab).className
                , tabListClassName: (StyleX.props styles.tabList).className
                , terminalClassName: (StyleX.props styles.terminal).className
                , tooltipClassName: (StyleX.props styles.tooltip).className
                }
            ]
        ]
    ]
