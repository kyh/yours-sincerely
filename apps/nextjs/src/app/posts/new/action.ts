"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";

import { api } from "@/trpc/server";

export const action = async () => {
  const auth = await api.auth.me();
  if (auth) return;
  const supabase = createServerActionClient({ cookies });

  const { error, data } = await supabase.auth.signInAnonymously();

  if (error) throw error;

  return data.user;
};
