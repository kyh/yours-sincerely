import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { CommentFeed } from "@/components/post/comment-feed";
import { api } from "@/trpc/server";

type Props = {
  params: {
    pid: string;
  };
};

const Page = async ({ params: { pid } }: Props) => {
  const post = await api.post.byId({ id: pid });
  const currentUser = await api.account.me();

  return (
    <>
      <PageHeader title="Post" />
      <PageContent>
        <CommentFeed post={post} user={currentUser} />
      </PageContent>
    </>
  );
};

export default Page;
