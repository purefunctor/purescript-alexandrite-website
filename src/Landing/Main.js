const macOSPlatform = /mac/i;

export const configurePlatformStyles = () => {
  const platform = navigator.userAgentData?.platform ?? navigator.platform ?? "";
  const interactiveCursor = macOSPlatform.test(platform) ? "default" : "pointer";

  document.documentElement.style.setProperty(
    "--landing-interactive-cursor",
    interactiveCursor,
  );
};
