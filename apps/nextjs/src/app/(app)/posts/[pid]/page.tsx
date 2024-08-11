import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { api } from "@/trpc/server";
import { CommentFeed } from "../_components/comment-feed";

type Props = {
  params: {
    pid: string;
  };
};

const Page = async ({ params: { pid } }: Props) => {
  const currentUser = await api.account.me();
  await api.post.byId.prefetch({ id: pid });

  return (
    <>
      <PageHeader title="Post" />
      <PageContent>
        <CommentFeed pid={pid} user={currentUser} />
      </PageContent>
    </>
  );
};

export default Page;
