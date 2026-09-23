import assert from "node:assert/strict";
import test from "node:test";

import { toViewer } from "./session-user.ts";

test("the viewer carries only what a client reads about its own account", () => {
  const row = {
    createdAt: "2026-01-01 00:00:00.000",
    disabled: null,
    displayImage: null,
    displayName: "Anonymous",
    email: "writer@example.com",
    emailVerified: null,
    id: "user-1",
    passwordHash: "$2b$10$not-a-real-hash",
    role: "ADMIN",
    sessionEpoch: 3,
    weeklyDigestEmail: false,
  };

  assert.deepEqual(toViewer(row), {
    disabled: null,
    displayImage: null,
    displayName: "Anonymous",
    email: "writer@example.com",
    id: "user-1",
  });
});
