import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { api } from "@/trpc/server";
import { CommentFeed } from "../_components/comment-feed";

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
