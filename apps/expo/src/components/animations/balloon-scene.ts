interface Viewport {
  width: number;
  height: number;
}

/** Web's 1500px perspective, with its origin at the bottom-center of the viewport. */
export const projectBalloon = (x: number, y: number, depth: number, viewport: Viewport) => {
  "worklet";
  const scale = 1500 / (1500 - depth);
  return {
    scale,
    x: viewport.width / 2 + (x - viewport.width / 2) * scale,
    y: viewport.height + (y - viewport.height) * scale,
  };
};

export const createBalloonScene = (viewport: Viewport, random = Math.random) => {
  // The web element uses a 233px nominal width around its 223px SVG viewBox.
  const width = (233 / 609) * Math.floor(Math.min(viewport.width, viewport.height));
  const amount = Math.max(7, Math.round(viewport.width / (width / 2)));
  const maxDistance = Math.max((amount * width) / 2, (width / 2) * 10);
  const positions = Array.from({ length: amount }, () => {
    const x = Math.round(viewport.width * random());
    return {
      depth: Math.round(-random() * maxDistance),
      targetX: Math.round(x + random() * width * 6 * (random() > 0.5 ? 1 : -1)),
      x,
    };
  });
  positions.sort((a, b) => a.depth - b.depth);
  const nearestDepth = positions.at(-1)?.depth ?? 0;
  return positions.map((position, index) => ({
    ...position,
    blur: index + 2 > 7,
    delay: (index + 2) * 200,
    depth: position.depth - nearestDepth,
    width,
  }));
};
