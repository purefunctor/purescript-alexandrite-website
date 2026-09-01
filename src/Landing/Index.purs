module Landing.Index (component) where

import Prelude

import Alexandrite.StyleX as StyleX
import Data.Foldable (for_)
import Effect (Effect)
import Effect.Unsafe (unsafePerformEffect)
import Landing.Component.ContentShell as ContentShell
import Landing.Component.Features as Features
import Landing.Component.Header as Header
import Landing.Component.HeroRibbons as HeroRibbons
import Landing.Component.Icon as Icon
import Landing.Component.Installation as Installation
import React.Basic (ReactComponent, element)
import React.Basic.Hooks as Hooks
import Web.DOM.Element as Element
import Web.HTML (window)
import Web.HTML.HTMLDocument as HTMLDocument
import Web.HTML.HTMLHtmlElement as HTMLHtmlElement
import Web.HTML.Navigator as Navigator
import Web.HTML.Window as Window
import Yoga.React.DOM as DOM
import Yoga.React.DOM.Attributes.Target (targetBlank)

styles = StyleX.create
  { page: { backgroundColor: "var(--landing-color-paper)", fontFamily: "InterVariable, sans-serif", minHeight: "100vh" }
  , hero: { alignItems: "flex-start", display: "flex", flexDirection: "column", isolation: "isolate", justifyContent: "center", minHeight: { default: "calc(100svh - 72px)", "@media (max-width: 700px)": "calc(100svh - 68px)" }, paddingBlock: { default: 88, "@media (max-width: 800px)": 60 }, position: "relative" }
  , heroContent: { alignItems: "flex-start", display: "flex", flexDirection: "column", position: "relative", width: "100%", zIndex: 1 }
  , heroTitle: { fontSize: "clamp(3.5rem, 8vw, 7.5rem)", fontWeight: 520, letterSpacing: "-0.055em", lineHeight: 0.94, marginBlock: "22px 28px", maxWidth: 880 }
  , heroTitleAccent: { backgroundColor: "var(--landing-color-mineral)", color: "var(--landing-color-paper)", display: "block", marginBlockStart: "0.12em", marginInlineStart: "clamp(24px, 8vw, 96px)", paddingInline: "0.08em 0.12em", width: "fit-content", "@media (max-width: 800px)": { marginInlineStart: 0 } }
  , lead: { color: "var(--landing-color-muted)", fontSize: "clamp(1.05rem, 2vw, 1.35rem)", lineHeight: 1.55, marginInlineStart: "clamp(12px, 4vw, 48px)", maxWidth: 900, textWrap: "balance", "@media (max-width: 800px)": { marginInlineStart: 0 } }
  , line: { display: "block" }
  , learnMore: { color: { default: "var(--landing-color-ink)", ":hover": "var(--landing-color-mineral)" }, cursor: "pointer", fontWeight: 500, textDecorationLine: "underline", textDecorationThickness: 1, textUnderlineOffset: 4, transition: "color 160ms ease", ":focus-visible": { outlineColor: "var(--landing-color-crystal)", outlineOffset: 3, outlineStyle: "solid", outlineWidth: 2 } }
  , learnMoreRow: { marginInlineStart: "clamp(12px, 4vw, 48px)", marginTop: 24, "@media (max-width: 800px)": { marginInlineStart: 0 } }
  , footer: { backgroundColor: "var(--landing-color-purescript-charcoal)", display: "grid", gap: 8, minHeight: 88, padding: "32px", placeItems: "center", textAlign: "center", width: "100%", "@media (max-width: 640px)": { minHeight: 72, padding: "24px 20px" } }
  , footerCopy: { color: "var(--landing-color-muted-inverse)", fontSize: 14, lineHeight: 1.6, marginInline: "auto", maxWidth: 760 }
  , footerLink: { color: { default: "var(--landing-color-paper)", ":hover": "var(--landing-color-signal)" }, textDecorationLine: "underline", textDecorationThickness: 1, textUnderlineOffset: 3, ":focus-visible": { outlineColor: "var(--landing-color-crystal)", outlineOffset: 3, outlineStyle: "solid", outlineWidth: 2 } }
  , footerCopyrights: { alignItems: "center", display: "flex", flexWrap: "wrap", gap: "4px 20px", justifyContent: "center" }
  , footerCopyrightItem: { alignItems: "center", display: "inline-flex", gap: 5 }
  , footerCopyrightIcon: { display: "inline-flex", fontSize: 14 }
  }

component :: ReactComponent {}
component = unsafePerformEffect do
  headerComponent <- Header.header
  Hooks.reactComponent "LandingPage" \_ -> Hooks.do
    Hooks.useEffectOnce configurePlatformStyles
    pure $ DOM.div (StyleX.props styles.page)
      [ headerComponent unit
      , DOM.main {}
          [ DOM.div (StyleX.props styles.hero)
              [ DOM.div ContentShell.contentShell
                  [ DOM.div (StyleX.props styles.heroContent)
                      [ DOM.h1 (StyleX.props styles.heroTitle)
                          [ DOM.span (StyleX.props styles.line) "PureScript"
                          , DOM.span (StyleX.props styles.heroTitleAccent) "Alexandrite"
                          ]
                      , DOM.p (StyleX.props styles.lead)
                          [ DOM.span (StyleX.props styles.line) "Modern, feature-rich, high-performance compiler for PureScript:"
                          , DOM.span (StyleX.props styles.line)
                              "a strongly-typed functional programming language for all stacks"
                          ]
                      , DOM.p (StyleX.props styles.learnMoreRow)
                          [ DOM.a { className: (StyleX.props styles.learnMore).className, href: "#features" } "Features" ]
                      ]
                  ]
              , HeroRibbons.heroRibbons
              ]
          , Installation.installationSection
          , HeroRibbons.separatorRibbons
          , DOM.div ContentShell.contentShell [ Features.featuresSection ]
          ]
      , DOM.footer (StyleX.props styles.footer)
          [ DOM.p (StyleX.props styles.footerCopy)
              [ DOM.span {} "The PureScript logo by Gareth Hughes is used under the terms of the "
              , DOM.a
                  { className: (StyleX.props styles.footerLink).className
                  , href: "https://creativecommons.org/licenses/by/4.0/"
                  , target: targetBlank
                  , rel: "noopener noreferrer"
                  }
                  "Creative Commons Attribution 4.0 license"
              , DOM.span {} "."
              ]
          , DOM.p (StyleX.props [ styles.footerCopy, styles.footerCopyrights ])
              [ DOM.span (StyleX.props styles.footerCopyrightItem)
                  [ DOM.span
                      { className: (StyleX.props styles.footerCopyrightIcon).className
                      , role: "img"
                      , "aria-label": "Copyright"
                      }
                      (element Icon.copyright { "aria-hidden": true, focusable: false })
                  , DOM.a
                      { className: (StyleX.props styles.footerLink).className
                      , href: "https://github.com/purescript/purescript/blob/master/LICENSE"
                      , target: targetBlank
                      , rel: "noopener noreferrer"
                      }
                      "PureScript"
                  , DOM.span {} " 2017–2025"
                  ]
              , DOM.span (StyleX.props styles.footerCopyrightItem)
                  [ DOM.span
                      { className: (StyleX.props styles.footerCopyrightIcon).className
                      , role: "img"
                      , "aria-label": "Copyright"
                      }
                      (element Icon.copyright { "aria-hidden": true, focusable: false })
                  , DOM.a
                      { className: (StyleX.props styles.footerLink).className
                      , href: "https://github.com/purefunctor/purescript-alexandrite/blob/main/LICENSE"
                      , target: targetBlank
                      , rel: "noopener noreferrer"
                      }
                      "Alexandrite"
                  , DOM.span {} " by purefunctor, 2023–2026"
                  ]
              ]
          ]
      ]

configurePlatformStyles :: Effect (Effect Unit)
configurePlatformStyles = do
  browserWindow <- window
  platform <- Window.navigator browserWindow >>= Navigator.platform
  when (isMacOS platform) do
    document <- Window.document browserWindow
    documentElement <- HTMLDocument.documentElement document
    for_ documentElement \html ->
      Element.setAttribute "data-landing-macos" "" (HTMLHtmlElement.toElement html)
  pure (pure unit)

isMacOS :: String -> Boolean
isMacOS platform =
  platform == "MacIntel"
    || platform == "MacPPC"
    || platform == "Mac68K"
    || platform == "macOS"
