import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { api, HydrateClient } from "@/trpc/server";
import { CommentFeed } from "../_components/comment-feed";

type Props = {
  params: {
    pid: string;
  };
};

const Page = async ({ params: { pid } }: Props) => {
  await api.post.getPost.prefetch({ id: pid });

  return (
    <HydrateClient>
      <PageHeader title="Post" />
      <PageContent>
        <CommentFeed pid={pid} />
      </PageContent>
    </HydrateClient>
  );
};

export default Page;
