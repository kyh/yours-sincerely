// import { createMeta } from "~/lib/core/util/meta";
import { redirect } from "next/navigation";

import { PageContent, PageHeader } from "@/components/page-layout";
import { NoProfile } from "@/lib/user/ui/noprofile";
import { api } from "@/trpc/server";

const Page = async () => {
  const user = await api.auth.me();
  if (user) redirect(`/${user.id}`);

  return (
    <>
      <PageHeader title="Profile" />
      <PageContent>
        <NoProfile />
      </PageContent>
    </>
  );
};

export default Page;
