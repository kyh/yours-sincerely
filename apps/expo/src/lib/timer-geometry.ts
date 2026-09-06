/** SVG sector from 12 o'clock sweeping `percentage` of a circle of `radius`
    clockwise — the native stand-in for the web timer's conic-gradient pie. */
export const sectorPath = (percentage: number, radius: number): string => {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const angle = (clamped / 100) * 360;
  const largeArc = angle > 180 ? 1 : 0;
  const radians = ((angle - 90) * Math.PI) / 180;
  const x = radius + radius * Math.cos(radians);
  const y = radius + radius * Math.sin(radians);
  return `M ${radius} ${radius} L ${radius} 0 A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y} Z`;
};
