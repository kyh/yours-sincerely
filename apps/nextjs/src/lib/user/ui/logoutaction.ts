"use server";

import { signOut } from "@/lib/auth/ui/actions";

export const action = async () => {
  await signOut();
};
