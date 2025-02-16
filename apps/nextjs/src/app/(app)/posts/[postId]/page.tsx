import { Metadata } from "next";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { api, HydrateClient } from "@/trpc/server";
import { PostPage } from "./post-page";

export const metadata: Metadata = {
  title: "A love letter",
};

type Props = {
  params: Promise<{
    postId: string;
  }>;
};

const Page = async (props: Props) => {
  const params = await props.params;

  await api.post.getPost.prefetch({ postId: params.postId });

  return (
    <HydrateClient>
      <PageHeader title="Post" />
      <PageContent className="flex flex-col gap-5">
        <PostPage postId={params.postId} />
      </PageContent>
    </HydrateClient>
  );
};

export default Page;
