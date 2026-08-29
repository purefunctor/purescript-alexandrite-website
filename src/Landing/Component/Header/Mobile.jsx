import { Children, cloneElement } from "react";
import {
  Button,
  Dialog,
  DialogTrigger,
  Modal,
  ModalOverlay,
} from "react-aria-components/Modal";

const navigationItemHeight = 60;
const separatorWidth = 10;
const navigationBandHeight = navigationItemHeight + separatorWidth;
const navigationCanvasWidth = 1000;
const navigationGeometry = {
  cornerRadius: 10,
  separatorWidth,
  shearHeight: -24,
  shearWidth: 32,
  terminalWidth: 48,
};

const roundedPolygon = (points, radius, roundedCorners) => {
  const commands = points.map((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const previousLength = Math.hypot(previous[0] - point[0], previous[1] - point[1]);
    const nextLength = Math.hypot(next[0] - point[0], next[1] - point[1]);
    const cornerRadius = roundedCorners.has(index) ? radius : 0;
    const previousRadius = Math.min(cornerRadius, previousLength / 2);
    const nextRadius = Math.min(cornerRadius, nextLength / 2);
    const start = [
      point[0] + ((previous[0] - point[0]) / previousLength) * previousRadius,
      point[1] + ((previous[1] - point[1]) / previousLength) * previousRadius,
    ];
    const end = [
      point[0] + ((next[0] - point[0]) / nextLength) * nextRadius,
      point[1] + ((next[1] - point[1]) / nextLength) * nextRadius,
    ];

    return `${index === 0 ? "M" : "L"} ${start[0]} ${start[1]} Q ${point[0]} ${point[1]} ${end[0]} ${end[1]}`;
  });

  return `${commands.join(" ")} Z`;
};

const roundedPolyline = (points, radius) => {
  const commands = [`M ${points[0][0]} ${points[0][1]}`];

  points.slice(1, -1).forEach((point, index) => {
    const previous = points[index];
    const next = points[index + 2];
    const previousLength = Math.hypot(previous[0] - point[0], previous[1] - point[1]);
    const nextLength = Math.hypot(next[0] - point[0], next[1] - point[1]);
    const previousRadius = Math.min(radius, previousLength / 2);
    const nextRadius = Math.min(radius, nextLength / 2);
    const start = [
      point[0] + ((previous[0] - point[0]) / previousLength) * previousRadius,
      point[1] + ((previous[1] - point[1]) / previousLength) * previousRadius,
    ];
    const end = [
      point[0] + ((next[0] - point[0]) / nextLength) * nextRadius,
      point[1] + ((next[1] - point[1]) / nextLength) * nextRadius,
    ];

    commands.push(`L ${start[0]} ${start[1]} Q ${point[0]} ${point[1]} ${end[0]} ${end[1]}`);
  });

  const last = points.at(-1);
  commands.push(`L ${last[0]} ${last[1]}`);
  return commands.join(" ");
};

const navigationShape = (fill, points, cornerRadius, key) => (
  <path
    d={roundedPolygon(points, cornerRadius, new Set([1, 2, 5, 6]))}
    fill={fill}
    key={key}
  />
);

const navigationSeparator = (points, separatorWidth, cornerRadius, key) => (
  <path
    d={roundedPolyline(points, cornerRadius)}
    fill="none"
    key={key}
    stroke="var(--landing-color-purescript-charcoal)"
    strokeLinecap="butt"
    strokeLinejoin="round"
    strokeWidth={separatorWidth}
    vectorEffect="non-scaling-stroke"
  />
);

const navigationPoints = (geometry, index) => {
  const top = index * navigationBandHeight;
  const shearEnd = navigationCanvasWidth - geometry.terminalWidth;
  const shearStart = shearEnd - geometry.shearWidth;
  const verticalOffset = Math.max(-geometry.shearHeight, 0);
  const leftTop = top + geometry.shearHeight + verticalOffset;
  const rightTop = top + verticalOffset;

  const points = [
    [0, leftTop],
    [shearStart, leftTop],
    [shearEnd, rightTop],
    [navigationCanvasWidth, rightTop],
    [navigationCanvasWidth, rightTop + navigationBandHeight],
    [shearEnd, rightTop + navigationBandHeight],
    [shearStart, leftTop + navigationBandHeight],
    [0, leftTop + navigationBandHeight],
  ];

  return points.map(([horizontal, vertical]) => [navigationCanvasWidth - horizontal, vertical]);
};

const navigationBoundary = (geometry, index) => {
  const top = index * navigationBandHeight;
  const shearEnd = navigationCanvasWidth - geometry.terminalWidth;
  const shearStart = shearEnd - geometry.shearWidth;
  const verticalOffset = Math.max(-geometry.shearHeight, 0);
  const points = [
    [0, top + geometry.shearHeight + verticalOffset],
    [shearStart, top + geometry.shearHeight + verticalOffset],
    [shearEnd, top + verticalOffset],
    [navigationCanvasWidth, top + verticalOffset],
  ];

  return points.map(([horizontal, vertical]) => [navigationCanvasWidth - horizontal, vertical]);
};

const renderNavigationBackground = (geometry, className) => {
  const fills = [
    "var(--landing-color-action-github)",
    "var(--landing-color-action-bluesky)",
  ];
  const shapes = fills.map((fill, index) =>
    navigationShape(
      fill,
      navigationPoints(geometry, index),
      geometry.cornerRadius,
      `shape-${index}`,
    ),
  );
  const separators = Array.from({ length: fills.length + 1 }, (_, index) =>
    navigationSeparator(
      navigationBoundary(geometry, index),
      geometry.separatorWidth,
      geometry.cornerRadius,
      `separator-${index}`,
    ),
  );

  return (
    <svg aria-hidden className={className}>
      {shapes}
      {separators}
    </svg>
  );
};

const renderNavigation = (content, navigationBackgroundClassName) =>
  cloneElement(
    content,
    {
      style: {
        ...content.props.style,
        "--landing-navigation-shear-height": `${navigationGeometry.shearHeight}px`,
        "--landing-navigation-shear-offset": `${Math.abs(navigationGeometry.shearHeight)}px`,
        "--landing-navigation-left-top": `${Math.max(navigationGeometry.shearHeight, 0)}px`,
        "--landing-navigation-right-top": `${Math.max(-navigationGeometry.shearHeight, 0)}px`,
        "--landing-navigation-shear-width": `${navigationGeometry.shearWidth}px`,
        "--landing-navigation-terminal-width": `${navigationGeometry.terminalWidth}px`,
      },
    },
    renderNavigationBackground(navigationGeometry, navigationBackgroundClassName),
    ...Children.toArray(content.props.children),
  );

export const navigationDrawerImpl = (classes) => (triggerIcon) => (closeIcon) => (content) => {
  const navigation = renderNavigation(content, classes.navigationBackground);
  return (
    <DialogTrigger>
      <Button
        aria-label="Open navigation"
        className={classes.trigger}
        type="button"
      >
        {triggerIcon}
      </Button>
      <ModalOverlay
        className={({ isEntering, isExiting }) =>
          classes.overlay(isEntering || isExiting)
        }
        isDismissable
      >
        <Modal
          className={({ isEntering, isExiting }) =>
            classes.modal(isEntering || isExiting)
          }
        >
          <Dialog
            aria-label="Navigation"
            className={classes.dialog}
            data-navigation-drawer
          >
            <div className={classes.closeRow}>
              <Button
                aria-label="Close navigation"
                className={classes.close}
                slot="close"
                type="button"
              >
                {closeIcon}
              </Button>
            </div>
            {navigation}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
};
