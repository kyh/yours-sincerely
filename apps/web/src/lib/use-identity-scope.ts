"use client";

import { useState } from "react";
import type { MutationScope } from "@tanstack/react-query";

import { useWorkspaceUser } from "@/lib/use-workspace-user";

const IDENTITY_SCOPE: MutationScope = { id: "identity" };

/**
 * For the mutations that can mint an anonymous user: createPost, createLike,
 * createFlag, createBlock. Without a cookie, two in flight would each mint one,
 * the browser would keep whichever Set-Cookie lands last, and the other write
 * would belong to nobody. One shared TanStack scope runs them one at a time, so
 * every write after the first carries its cookie. Expo's `identityProcedures`
 * lock is the native half.
 *
 * Once on, it stays on while mounted: TanStack copies changed options onto a
 * pending mutation, and dropping the scope mid-flight leaves the next queued
 * mutation paused with nothing to resume it.
 */
export const useIdentityScope = () => {
  const anonymous = useWorkspaceUser() === null;
  const [scoped, setScoped] = useState(anonymous);
  if (anonymous && !scoped) {
    setScoped(true);
  }
  return scoped ? IDENTITY_SCOPE : undefined;
};
