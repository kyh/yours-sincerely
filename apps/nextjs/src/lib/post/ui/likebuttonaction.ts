"use server";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

// import { auth, signIn } from "@init/auth";

export const action = async () => {
  const session = (await auth())?.user;
  if (!session)
    await signIn("credentials", {
      email: "",
    });
};
