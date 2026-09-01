import { useEffect } from "react";
import { landingPage } from "../output/Landing.Index/index.js";

const renderLandingPage = landingPage();
const macOSPlatform = /mac/i;

function configurePlatformStyles() {
  const platform = navigator.userAgentData?.platform ?? navigator.platform ?? "";
  const interactiveCursor = macOSPlatform.test(platform) ? "default" : "pointer";

  document.documentElement.style.setProperty(
    "--landing-interactive-cursor",
    interactiveCursor,
  );
}

export default function LandingPage() {
  useEffect(configurePlatformStyles, []);
  return renderLandingPage(undefined);
}
