import { redirect } from "next/navigation";

import { api } from "@/trpc/server";

export async function loadTeamPagePageData() {
  const { accounts } = await api.account.userWorkspace();
  const slug = accounts?.[0]?.slug ?? "";

  if (!slug) {
    return redirect("/account");
  }

  const { account, user } = await api.team.teamWorkspace({ slug });

  if (!account) {
    return redirect("/account");
  }

  const invitations = await api.team.invitations({ slug });

  return {
    account,
    user,
    slug,
    invitations: invitations ?? [],
  };
}
