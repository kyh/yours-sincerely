// import { createMeta } from "~/lib/core/util/meta";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { NoProfile } from "@/lib/user/ui/noprofile";
import { api } from "@/trpc/server";

const Page = async () => {
  const user = await api.auth.me();
  if (user) redirect(`/${user.id}`);

  return (
    <>
      <PageHeader title="Profile" />
      <main className="pt-5">
        <NoProfile />
      </main>
    </>
  );
};

export default Page;
