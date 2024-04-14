"use server";

import { api } from "@/trpc/server";

export const action = async (cursor: string) => {
  return await api.posts.list({ filters: { cursor: cursor } });
};