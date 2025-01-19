import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { api, HydrateClient } from "@/trpc/server";
import { CommentFeed } from "../_components/comment-feed";

type Props = {
  params: Promise<{
    pid: string;
  }>;
};

const Page = async (props: Props) => {
  const params = await props.params;

  await api.post.getPost.prefetch({ postId: params.pid });

  return (
    <HydrateClient>
      <PageHeader title="Post" />
      <PageContent className="flex flex-col gap-5">
        <CommentFeed postId={params.pid} />
      </PageContent>
    </HydrateClient>
  );
};

export default Page;
