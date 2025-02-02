import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { api, HydrateClient } from "@/trpc/server";
import { Profile } from "../_components/profile";

type Props = {
  params: Promise<{
    userId: string;
  }>;
};

const Page = async (props: Props) => {
  const params = await props.params;

  void api.user.getUser.prefetch({ userId: params.userId });
  void api.user.getUserStats.prefetch({ userId: params.userId });
  void api.post.getPostsByUser.prefetch({ userId: params.userId });

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
