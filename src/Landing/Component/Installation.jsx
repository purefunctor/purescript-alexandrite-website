import { useEffect, useState } from "react";
import { Button, Tab, TabList, TabPanel, Tabs, Tooltip, TooltipTrigger } from "react-aria-components";
import WindowsIcon from "~icons/simple-icons/windows";
import CheckIcon from "~icons/lucide/check";
import CopyIcon from "~icons/lucide/copy";
import TerminalIcon from "~icons/lucide/terminal";

const unixCopyCommand = "curl --proto '=https' --tlsv1.2 -LsSf https://install.alexandrite.dev/install.sh | sh";
const windowsCommand = "irm https://install.alexandrite.dev/install.ps1 | iex";

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.readOnly = true;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  }
}

function Command({
  command,
  commandClassName,
  copyButtonClassName,
  copyButtonVisibleClassName,
  copyCommand = command,
  prompt,
  promptClassName,
  terminalClassName,
  tooltipClassName,
}) {
  const [copied, setCopied] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copy = async () => {
    if (await copyToClipboard(copyCommand)) setCopied(true);
  };

  const copyButtonClasses = [
    copyButtonClassName,
    hovered || focused || copied ? copyButtonVisibleClassName : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      className={commandClassName}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <pre className={terminalClassName}><code><span className={promptClassName}>{prompt}</span>{command}</code></pre>
      <TooltipTrigger isOpen={copied}>
        <Button
          aria-label="Copy installation command"
          className={copyButtonClasses}
          onBlur={() => setFocused(false)}
          onFocus={() => setFocused(true)}
          onPress={copy}
        >
          {copied ? <CheckIcon aria-hidden="true" focusable="false" /> : <CopyIcon aria-hidden="true" focusable="false" />}
        </Button>
        <Tooltip className={tooltipClassName} offset={10} placement="top">Copied</Tooltip>
      </TooltipTrigger>
    </div>
  );
}

export function installationCommandsImpl({
  commandClassName,
  copyButtonClassName,
  copyButtonVisibleClassName,
  promptClassName,
  rootClassName,
  tabClassName,
  tabListClassName,
  terminalClassName,
  tooltipClassName,
}) {
  const commandProps = {
    commandClassName,
    copyButtonClassName,
    copyButtonVisibleClassName,
    promptClassName,
    terminalClassName,
    tooltipClassName,
  };

  return (
    <Tabs className={rootClassName} defaultSelectedKey="unix">
      <TabList aria-label="Installation platform" className={tabListClassName}>
        <Tab aria-label="Linux and macOS" className={tabClassName} id="unix"><TerminalIcon aria-hidden="true" focusable="false" /></Tab>
        <Tab aria-label="Windows" className={tabClassName} id="windows"><WindowsIcon aria-hidden="true" focusable="false" /></Tab>
      </TabList>
      <TabPanel id="unix"><Command {...commandProps} command={unixCopyCommand} prompt="$ " /></TabPanel>
      <TabPanel id="windows"><Command {...commandProps} command={windowsCommand} prompt="PS> " /></TabPanel>
    </Tabs>
  );
}
