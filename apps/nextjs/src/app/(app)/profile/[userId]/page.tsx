import type { Metadata } from "next";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { Profile } from "../_components/profile";

export const metadata: Metadata = {
  title: "Profile",
};

type Props = {
  params: Promise<{
    userId: string;
  }>;
};

const Page = async (props: Props) => {
  const params = await props.params;

  prefetch(trpc.user.getUser.queryOptions({ userId: params.userId }));
  prefetch(trpc.user.getUserStats.queryOptions({ userId: params.userId }));
  prefetch(trpc.post.getPostsByUser.queryOptions({ userId: params.userId }));

  return (
    <HydrateClient>
      <PageHeader title="Profile" />
      <PageContent>
        <Profile userId={params.userId} />
      </PageContent>
    </HydrateClient>
  );
};

export default Page;
