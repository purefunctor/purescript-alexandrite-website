module Landing.Component.Header.Mobile
  ( brandIconStyle
  , externalLinkIconStyle
  , linkContentStyle
  , linkStyle
  , navigationDrawer
  , navigationIconStyle
  , navigationStyle
  ) where

import Prelude

import Alexandrite.StyleX as StyleX
import React.Basic (JSX)

styles = StyleX.create
  { navigation:
      { display: "flex"
      , flexDirection: "column"
      , gap: 0
      , paddingTop: "var(--landing-navigation-shear-offset, 24px)"
      , position: "relative"
      }
  , navigationBackground:
      { height: "100%", inset: 0, pointerEvents: "none", position: "absolute", width: "100%" }
  , trigger:
      { "WebkitTapHighlightColor": "transparent"
      , alignItems: "center"
      , backgroundColor: { default: "transparent", ":hover": "oklch(100% 0 0 / 0.12)" }
      , borderRadius: 999
      , color: "var(--landing-color-paper)"
      , cursor: "var(--landing-interactive-cursor, pointer)"
      , display: "none"
      , height: 42
      , justifyContent: "center"
      , width: 42
      , ":focus-visible":
          { outlineColor: "var(--landing-color-signal)"
          , outlineOffset: 2
          , outlineStyle: "solid"
          , outlineWidth: 2
          }
      , "@media (max-width: 700px)": { display: "inline-flex" }
      }
  , overlay:
      { alignItems: "stretch"
      , backgroundColor: "oklch(22.29% 0.0049 173.9 / 0.2)"
      , display: "flex"
      , inset: 0
      , justifyContent: "flex-end"
      , opacity: 1
      , position: "fixed"
      , transitionDuration: "100ms"
      , transitionProperty: "opacity"
      , transitionTimingFunction: "linear"
      , width: "100vw"
      , zIndex: 20
      , "@media (prefers-reduced-motion: reduce)": { transitionDuration: "0ms" }
      }
  , overlayTransition:
      { opacity: 0 }
  , modal:
      { backgroundColor: "var(--landing-color-purescript-charcoal)"
      , color: "var(--landing-color-paper)"
      , flexShrink: 0
      , height: "100dvh"
      , maxWidth: "none"
      , opacity: 1
      , padding: 0
      , transform: "translateX(0)"
      , transitionDuration: "140ms, 90ms"
      , transitionProperty: "transform, opacity"
      , transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1), ease-out"
      , width: "100vw"
      , "@media (prefers-reduced-motion: reduce)": { transitionDuration: "0ms" }
      }
  , modalTransition:
      { opacity: 0
      , transform: "translateX(24px)"
      }
  , dialog: { display: "flex", flexDirection: "column", gap: 0, height: "100%", outline: "none" }
  , closeRow:
      { display: "flex"
      , justifyContent: "flex-end"
      , minHeight: 68
      , paddingBottom: 13
      , paddingLeft: 24
      , paddingRight: 20
      , paddingTop: 13
      }
  , close:
      { "WebkitTapHighlightColor": "transparent"
      , alignItems: "center"
      , backgroundColor: { default: "transparent", ":hover": "oklch(100% 0 0 / 0.12)" }
      , borderRadius: 999
      , color: "var(--landing-color-paper)"
      , cursor: "var(--landing-interactive-cursor, pointer)"
      , display: "inline-flex"
      , height: 42
      , justifyContent: "center"
      , width: 42
      , ":focus-visible":
          { outlineColor: "var(--landing-color-crystal)"
          , outlineOffset: 2
          , outlineStyle: "solid"
          , outlineWidth: 2
          }
      }
  , mobileLink:
      { "--landing-navigation-external-offset": "8px"
      , "--landing-navigation-external-opacity": 0
      , alignItems: "center"
      , backgroundColor: { default: "transparent", ":hover": "transparent" }
      , borderRadius: 0
      , clipPath:
          "polygon(0 var(--landing-navigation-right-top), var(--landing-navigation-terminal-width) var(--landing-navigation-right-top), calc(var(--landing-navigation-terminal-width) + var(--landing-navigation-shear-width)) var(--landing-navigation-left-top), 100% var(--landing-navigation-left-top), 100% calc(70px + var(--landing-navigation-left-top)), calc(var(--landing-navigation-terminal-width) + var(--landing-navigation-shear-width)) calc(70px + var(--landing-navigation-left-top)), var(--landing-navigation-terminal-width) calc(70px + var(--landing-navigation-right-top)), 0 calc(70px + var(--landing-navigation-right-top)))"
      , cursor: "default"
      , display: "grid"
      , fontFamily: "InterVariable, sans-serif"
      , fontSize: 14
      , fontWeight: 400
      , gap: 0
      , gridTemplateColumns:
          "var(--landing-navigation-terminal-width) var(--landing-navigation-shear-width) 40px calc(100% - 40px - var(--landing-navigation-shear-width) - var(--landing-navigation-terminal-width))"
      , height: "calc(70px + var(--landing-navigation-shear-offset))"
      , justifyContent: "normal"
      , letterSpacing: "0.025em"
      , marginTop: "calc(-1 * var(--landing-navigation-shear-offset))"
      , paddingBlock: 0
      , paddingInline: 0
      , textDecoration: "none"
      , whiteSpace: "nowrap"
      , width: "100%"
      , zIndex: 1
      , ":hover":
          { "--landing-navigation-external-offset": "0px"
          , "--landing-navigation-external-opacity": 1
          }
      , ":focus-visible":
          { "--landing-navigation-external-offset": "0px"
          , "--landing-navigation-external-opacity": 1
          , outlineColor: "var(--landing-color-crystal)"
          , outlineOffset: "-3px"
          , outlineStyle: "solid"
          , outlineWidth: 2
          }
      }
  , tryAlexandriteLink: { color: "var(--landing-color-action-try-alexandrite-foreground)" }
  , githubLink: { color: "var(--landing-color-action-github-foreground)" }
  , blueskyLink: { color: "var(--landing-color-action-bluesky-foreground)" }
  , documentationLink: { color: "var(--landing-color-action-documentation-foreground)" }
  , linkContent:
      { alignItems: "center"
      , display: "inline-flex"
      , gap: 8
      , gridColumn: "4"
      , gridRow: 1
      , justifySelf: "end"
      , marginLeft: 0
      , marginRight: 20
      , transform: "translateY(calc(var(--landing-navigation-shear-height) / 2))"
      }
  , externalLinkIcon:
      { alignItems: "center"
      , display: "inline-flex"
      , fontSize: 13
      , gridColumn: "3"
      , gridRow: 1
      , justifyContent: "center"
      , justifySelf: "start"
      , marginLeft: 20
      , marginRight: 0
      , opacity: "var(--landing-navigation-external-opacity)"
      , transform:
          "translate(var(--landing-navigation-external-offset), calc(var(--landing-navigation-shear-height) / 2))"
      , transitionDuration: "140ms, 160ms"
      , transitionProperty: "opacity, transform"
      , transitionTimingFunction: "ease-out, cubic-bezier(0.22, 1, 0.36, 1)"
      , width: "auto"
      , "@media (prefers-reduced-motion: reduce)": { transitionDuration: "0ms" }
      }
  , brandIcon:
      { alignItems: "center"
      , color: "#000000"
      , display: "inline-flex"
      , flexShrink: 0
      , fontSize: 13
      , justifyContent: "center"
      , opacity: 0.72
      , width: 39
      }
  , navigationIcon:
      { alignItems: "center"
      , display: "inline-flex"
      , flexShrink: 0
      , fontSize: 13
      , justifyContent: "center"
      , opacity: 0.72
      , width: 39
      }
  }

navigationStyle = StyleX.props styles.navigation
linkContentStyle = StyleX.props styles.linkContent
externalLinkIconStyle = StyleX.props styles.externalLinkIcon
brandIconStyle = StyleX.props styles.brandIcon
navigationIconStyle = StyleX.props styles.navigationIcon

linkStyle destination =
  StyleX.props
    [ styles.mobileLink
    , StyleX.conditional (destination == "try-alexandrite") styles.tryAlexandriteLink
    , StyleX.conditional (destination == "github") styles.githubLink
    , StyleX.conditional (destination == "bluesky") styles.blueskyLink
    , StyleX.conditional (destination == "documentation") styles.documentationLink
    ]

foreign import navigationDrawerImpl :: DrawerClasses -> JSX -> JSX -> JSX -> JSX

type DrawerClasses =
  { trigger :: String
  , navigationBackground :: String
  , overlay :: Boolean -> String
  , modal :: Boolean -> String
  , dialog :: String
  , closeRow :: String
  , close :: String
  }

navigationDrawer :: JSX -> JSX -> JSX -> JSX
navigationDrawer = navigationDrawerImpl
  { trigger: (StyleX.props styles.trigger).className
  , navigationBackground: (StyleX.props styles.navigationBackground).className
  , overlay: \transitioning ->
      ( StyleX.props
          [ styles.overlay
          , StyleX.conditional transitioning styles.overlayTransition
          ]
      ).className
  , modal: \transitioning ->
      ( StyleX.props
          [ styles.modal
          , StyleX.conditional transitioning styles.modalTransition
          ]
      ).className
  , dialog: (StyleX.props styles.dialog).className
  , closeRow: (StyleX.props styles.closeRow).className
  , close: (StyleX.props styles.close).className
  }
