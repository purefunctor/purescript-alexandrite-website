import { useState } from "react";
import { Button, Tooltip, TooltipTrigger } from "react-aria-components";

export const editorHoverBinding = ({
  bindingClassName,
  tokenClassName,
  tooltipClassName,
  kindClassName,
  symbolClassName,
  typeClassName,
  kind,
  symbol,
  inferredType,
}) => {
  const [isOpen, setOpen] = useState(false);

  return (
    <TooltipTrigger
      closeDelay={75}
      delay={100}
      isOpen={isOpen}
      onOpenChange={setOpen}
    >
      <Button
        aria-label={symbol}
        className={bindingClassName}
        onBlur={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={(event) => {
          if (document.activeElement !== event.currentTarget) setOpen(false);
        }}
      >
        <span className={tokenClassName}>{symbol}</span>
      </Button>
      <Tooltip
        className={tooltipClassName}
        offset={8}
        placement="bottom start"
        shouldFlip
      >
        <span className={kindClassName}>({kind})</span>
        <span className={symbolClassName}>{symbol}</span>
        <span className={typeClassName}>{inferredType}</span>
      </Tooltip>
    </TooltipTrigger>
  );
};
