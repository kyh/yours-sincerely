import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { api, HydrateClient } from "@/trpc/server";
import { Profile } from "../_components/profile";

type Props = {
  params: {
    id: string;
  };
};

const Page = ({ params: { id } }: Props) => {
  void api.user.getUser.prefetch({ userId: id });
  void api.post.getFeed.prefetch({ userId: id });

  return (
    <HydrateClient>
      <PageHeader title="Profile" />
      <PageContent>
        <Profile id={id} />
      </PageContent>
    </HydrateClient>
  );
};

export default Page;
