const shearWidth = 180;
const shearHeight = 120;
const ribbonSpacing = 20;
const cornerRadius = 10;
const canvasWidth = 4800;
const shearLength = Math.hypot(shearWidth, shearHeight);
const horizontalRadius = cornerRadius * shearWidth / shearLength;
const verticalRadius = cornerRadius * shearHeight / shearLength;
const horizontalOffset = ribbonSpacing * (shearLength - shearWidth) / shearHeight;

const ribbonPath = (index) => {
  const leftHeight = 180 + ribbonSpacing * index;
  const rightHeight = 60 + ribbonSpacing * index;
  const shearStart = canvasWidth / 2 - shearWidth / 2 - 10 + horizontalOffset * index;
  const shearEnd = shearStart + shearWidth;

  return [
    `M -20 ${leftHeight}`,
    `H ${shearStart - cornerRadius}`,
    `Q ${shearStart} ${leftHeight} ${shearStart + horizontalRadius} ${leftHeight - verticalRadius}`,
    `L ${shearEnd - horizontalRadius} ${rightHeight + verticalRadius}`,
    `Q ${shearEnd} ${rightHeight} ${shearEnd + cornerRadius} ${rightHeight}`,
    `H ${canvasWidth + 20}`,
  ].join(" ");
};

const ribbonPaths = Array.from({ length: 5 }, (_, index) => ribbonPath(index));

export function heroRibbonsImpl({ ribbonsClassName, ribbon1ClassName, ribbon2ClassName, ribbon3ClassName, ribbon4ClassName, ribbon5ClassName }) {
  const ribbonClassNames = [ribbon1ClassName, ribbon2ClassName, ribbon3ClassName, ribbon4ClassName, ribbon5ClassName];
  return (
    <svg
      className={ribbonsClassName}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
      viewBox={`0 0 ${canvasWidth} 300`}
    >
      {ribbonPaths.map((path, index) => (
        <path
          className={ribbonClassNames[index]}
          d={path}
          key={path}
        />
      ))}
    </svg>
  );
}
