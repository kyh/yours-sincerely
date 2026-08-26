import type { Metadata } from "next";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { HydrateClient, prefetch, orpc } from "@/orpc/server";
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

  prefetch(orpc.user.getUser.queryOptions({ input: { userId: params.userId } }));
  prefetch(orpc.user.getUserStats.queryOptions({ input: { userId: params.userId } }));
  prefetch(orpc.post.getPostsByUser.queryOptions({ input: { userId: params.userId } }));

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
