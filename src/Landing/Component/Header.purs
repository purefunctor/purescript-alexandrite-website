module Landing.Component.Header (header) where

import Prelude

import Alexandrite.StyleX as StyleX
import Landing.Component.Header.Mobile as Mobile
import Landing.Component.Icon as Icon
import React.Basic (JSX, ReactComponent, element)
import React.Basic.Hooks (Component)
import React.Basic.Hooks as Hooks
import Yoga.React.DOM as DOM
import Yoga.React.DOM.Attributes.Target (targetBlank)

styles = StyleX.create
  { headerBackground:
      { backgroundColor: "var(--landing-color-purescript-charcoal)"
      , color: "var(--landing-color-paper)"
      , width: "100%"
      }
  , headerContent:
      { alignItems: "center"
      , display: "grid"
      , gap: 24
      , gridTemplateColumns: "minmax(0, 1fr) auto"
      , marginInline: "auto"
      , maxWidth: 1180
      , minHeight: 72
      , paddingBlock: 14
      , paddingInline: 32
      , width: "100%"
      , "@media (max-width: 700px)": { gap: 12, minHeight: 68, paddingBlock: 12, paddingInline: 20 }
      }
  , headerBrand:
      { alignItems: "center"
      , color: "var(--landing-color-paper)"
      , cursor: "pointer"
      , display: "flex"
      , gap: 11
      , position: "relative"
      , textDecoration: "none"
      , zIndex: 30
      }
  , headerBrandIcon:
      { alignItems: "center", display: "inline-flex", fontSize: 27, justifyContent: "center" }
  , headerBrandCopy: { display: "flex", flexDirection: "column", gap: 2 }
  , headerBrandName:
      { fontFamily: "Oxanium Variable, sans-serif"
      , fontSize: 18
      , fontWeight: 200
      , letterSpacing: "0.055em"
      , lineHeight: 1
      }
  , headerBrandSubtitle:
      { color: "var(--landing-color-muted-inverse)"
      , fontSize: 9
      , fontWeight: 450
      , letterSpacing: "0.025em"
      , lineHeight: 1.2
      }
  , desktopNavigation:
      { alignItems: "center"
      , display: "flex"
      , gap: 12
      , justifyContent: "flex-end"
      , "@media (max-width: 700px)": { display: "none" }
      }
  , desktopSocialLink:
      { alignItems: "center"
      , backgroundColor: { default: "transparent", ":hover": "oklch(100% 0 0 / 0.12)" }
      , borderRadius: 999
      , color: "var(--landing-color-paper)"
      , cursor: "default"
      , display: "inline-flex"
      , fontFamily: "InterVariable, sans-serif"
      , fontSize: 12
      , fontWeight: 620
      , justifyContent: "center"
      , letterSpacing: "normal"
      , marginInlineStart: 0
      , paddingBlock: 9
      , paddingInline: 10
      , textDecoration: "none"
      , whiteSpace: "nowrap"
      , ":focus-visible":
          { outlineColor: "var(--landing-color-crystal)"
          , outlineOffset: 2
          , outlineStyle: "solid"
          , outlineWidth: 2
          }
      }
  , desktopTryLink:
      { alignItems: "center"
      , backgroundColor:
          { default: "var(--landing-color-powder-rust)"
          , ":hover": "var(--landing-color-powder-rust-bright)"
          }
      , borderRadius: 999
      , color: "var(--landing-color-ink)"
      , cursor: "default"
      , display: "inline-flex"
      , fontFamily: "InterVariable, sans-serif"
      , fontSize: 14
      , fontWeight: 400
      , justifyContent: "center"
      , letterSpacing: "0.025em"
      , marginInlineStart: 18
      , paddingBlock: 9
      , paddingInline: 18
      , textDecoration: "none"
      , whiteSpace: "nowrap"
      , ":focus-visible":
          { outlineColor: "var(--landing-color-crystal)"
          , outlineOffset: 2
          , outlineStyle: "solid"
          , outlineWidth: 2
          }
      }
  , desktopDocumentationLink:
      { alignItems: "center"
      , backgroundColor:
          { default: "var(--landing-color-signal)", ":hover": "var(--landing-color-signal-bright)" }
      , borderRadius: 999
      , color: "var(--landing-color-ink)"
      , cursor: "default"
      , display: "inline-flex"
      , fontFamily: "InterVariable, sans-serif"
      , fontSize: 14
      , fontWeight: 400
      , justifyContent: "center"
      , letterSpacing: "0.025em"
      , marginInlineStart: 0
      , paddingBlock: 9
      , paddingInline: 18
      , textDecoration: "none"
      , whiteSpace: "nowrap"
      , ":focus-visible":
          { outlineColor: "var(--landing-color-crystal)"
          , outlineOffset: 2
          , outlineStyle: "solid"
          , outlineWidth: 2
          }
      }
  , headerLinkIcon:
      { alignItems: "center", display: "inline-flex", flexShrink: 0, fontSize: 13, opacity: 0.72 }
  , headerLinkContent: { alignItems: "center", display: "inline-flex", gap: 8 }
  , screenReaderOnly:
      { clip: "rect(0 0 0 0)"
      , clipPath: "inset(50%)"
      , height: 1
      , overflow: "hidden"
      , position: "absolute"
      , whiteSpace: "nowrap"
      , width: 1
      }
  }

headerBackground = StyleX.props styles.headerBackground
headerContent = StyleX.props styles.headerContent
headerBrand = StyleX.props styles.headerBrand
headerBrandIcon = StyleX.props styles.headerBrandIcon
headerBrandCopy = StyleX.props styles.headerBrandCopy
headerBrandName = StyleX.props styles.headerBrandName
headerBrandSubtitle = StyleX.props styles.headerBrandSubtitle
desktopNavigation = StyleX.props styles.desktopNavigation
headerLinkIcon = StyleX.props styles.headerLinkIcon
headerLinkContent = StyleX.props styles.headerLinkContent
screenReaderOnly = StyleX.props styles.screenReaderOnly

data NavigationDestination = TryAlexandrite | GitHub | Bluesky | Documentation
data NavigationLayout = DesktopNavigation | MobileNavigation

header :: Component Unit
header = Hooks.component "Header" \_ -> Hooks.do
  pure $ DOM.header headerBackground
    [ DOM.div headerContent
        [ brand
        , navigation desktopNavigation DesktopNavigation
        , Mobile.navigationDrawer
            (element Icon.menu { "aria-hidden": true, focusable: false })
            (element Icon.x { "aria-hidden": true, focusable: false })
            (navigation Mobile.navigationStyle MobileNavigation)
        ]
    ]

brand :: JSX
brand =
  DOM.a
    { className: headerBrand.className
    , href: "/"
    , target: targetBlank
    , rel: "noopener noreferrer"
    , "aria-label": "Alexandrite home"
    }
    [ DOM.span headerBrandIcon
        (element Icon.pureScript { "aria-hidden": true, focusable: false })
    , DOM.span headerBrandCopy
        [ DOM.span headerBrandName "ALEXANDRITE"
        , DOM.span headerBrandSubtitle "a modern PureScript compiler"
        ]
    ]

navigation :: StyleX.Props -> NavigationLayout -> JSX
navigation style layout =
  DOM.nav
    { className: style.className
    , id: navigationId layout
    , "aria-label": navigationLabel layout
    }
    if isDesktopNavigation layout then
      [ navigationLink layout GitHub
      , navigationLink layout Bluesky
      , navigationLink layout TryAlexandrite
      , navigationLink layout Documentation
      ]
    else
      [ navigationLink layout Documentation
      , navigationLink layout TryAlexandrite
      , navigationLink layout GitHub
      , navigationLink layout Bluesky
      ]

navigationLink :: NavigationLayout -> NavigationDestination -> JSX
navigationLink layout destination =
  let
    destinationName' = destinationName destination
    mobile = isMobileNavigation layout
    socialDesktop = isDesktopNavigation layout && isSocialDestination destination
    linkStyle =
      if mobile then Mobile.linkStyle destinationName'
      else desktopLinkStyle destination
    contentStyle =
      if mobile then Mobile.linkContentStyle
      else headerLinkContent
    label = destinationLabel destination
    destinationText =
      if socialDesktop then DOM.span screenReaderOnly label
      else DOM.span {} label
    destinationIconStyle =
      if not mobile then headerLinkIcon
      else if isSocialDestination destination then
        Mobile.brandIconStyle
      else Mobile.navigationIconStyle
    externalIcon =
      if mobile then
        [ DOM.span Mobile.externalLinkIconStyle
            (element Icon.externalLink { "aria-hidden": true, focusable: false })
        ]
      else []
    linkChildren =
      [ DOM.span contentStyle
          [ destinationText
          , DOM.span destinationIconStyle
              (element (destinationIcon destination) { "aria-hidden": true, focusable: false })
          ]
      ] <> externalIcon
  in
    DOM.a
      { className: linkStyle.className
      , href: destinationHref destination
      , hidden: isTemporarilyHiddenDestination destination
      , target: targetBlank
      , rel: "noopener noreferrer"
      }
      linkChildren

navigationId :: NavigationLayout -> String
navigationId = case _ of
  DesktopNavigation -> "primary-navigation-desktop"
  MobileNavigation -> "primary-navigation-mobile"

navigationLabel :: NavigationLayout -> String
navigationLabel = case _ of
  DesktopNavigation -> "Primary navigation"
  MobileNavigation -> "Mobile navigation"

isDesktopNavigation :: NavigationLayout -> Boolean
isDesktopNavigation = case _ of
  DesktopNavigation -> true
  _ -> false

isMobileNavigation :: NavigationLayout -> Boolean
isMobileNavigation = case _ of
  MobileNavigation -> true
  _ -> false

desktopLinkStyle :: NavigationDestination -> StyleX.Props
desktopLinkStyle = case _ of
  GitHub -> StyleX.props styles.desktopSocialLink
  Bluesky -> StyleX.props styles.desktopSocialLink
  TryAlexandrite -> StyleX.props styles.desktopTryLink
  Documentation -> StyleX.props styles.desktopDocumentationLink

isSocialDestination :: NavigationDestination -> Boolean
isSocialDestination = case _ of
  GitHub -> true
  Bluesky -> true
  _ -> false

isTemporarilyHiddenDestination :: NavigationDestination -> Boolean
isTemporarilyHiddenDestination = case _ of
  TryAlexandrite -> true
  Documentation -> true
  _ -> false

destinationName :: NavigationDestination -> String
destinationName = case _ of
  TryAlexandrite -> "try-alexandrite"
  GitHub -> "github"
  Bluesky -> "bluesky"
  Documentation -> "documentation"

destinationHref :: NavigationDestination -> String
destinationHref = case _ of
  TryAlexandrite -> "/try"
  GitHub -> "https://github.com/purefunctor/purescript-alexandrite"
  Bluesky -> "https://bsky.app/profile/purefunctor.me"
  Documentation -> "/docs"

destinationLabel :: NavigationDestination -> String
destinationLabel = case _ of
  TryAlexandrite -> "Try Alexandrite"
  GitHub -> "GitHub"
  Bluesky -> "Bluesky"
  Documentation -> "Documentation"

destinationIcon :: NavigationDestination -> ReactComponent Icon.IconProps
destinationIcon = case _ of
  TryAlexandrite -> Icon.code
  GitHub -> Icon.gitHub
  Bluesky -> Icon.bluesky
  Documentation -> Icon.bookOpen
