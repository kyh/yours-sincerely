import assert from "node:assert/strict";
import { it } from "node:test";

import { createBalloonScene, projectBalloon } from "./balloon-scene.ts";

it("keeps the web's balloon density and depth-ordered timing across phone orientations", () => {
  const portrait = createBalloonScene({ height: 852, width: 393 }, () => 0.5);
  const landscape = createBalloonScene({ height: 393, width: 852 }, () => 0.5);
  assert.equal(portrait.length, 7);
  assert.equal(landscape.length, 11);
  assert.equal(portrait[0]?.width, (233 / 609) * 393);
  assert.equal(portrait[0]?.delay, 400);
  assert.equal(portrait.at(-1)?.delay, 1600);
  assert.equal(portrait.filter((balloon) => balloon.blur).length, 1);
  assert.equal(portrait.at(-1)?.depth, 0);
});

it("projects depth around the viewport bottom without moving the nearest balloon", () => {
  const viewport = { height: 800, width: 400 };
  assert.deepEqual(projectBalloon(40, 100, 0, viewport), { scale: 1, x: 40, y: 100 });
  assert.deepEqual(projectBalloon(40, 100, -1500, viewport), { scale: 0.5, x: 120, y: 450 });
  assert.equal(projectBalloon(40, 850, -1500, viewport).y, 825);
});
