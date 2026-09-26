import { Suspense } from "react";
import type { Metadata } from "next";
import { Spinner } from "@repo/ui/components/spinner";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { fetchOrNotFound, HydrateClient, orpc } from "@/orpc/server";
import { PostPage } from "./post-page";

export const metadata: Metadata = {
  title: "A love letter",
};

interface Props {
  params: Promise<{
    postId: string;
  }>;
}

// No loading.tsx for this segment: its Suspense boundary would start the stream
// before the notFound() check, and a dead share link would answer 200.
const Page = async (props: Props) => {
  const params = await props.params;

  await fetchOrNotFound(orpc.post.getPost.queryOptions({ input: { postId: params.postId } }));

  return (
    <HydrateClient>
      <PageHeader title="Post" />
      <PageContent className="flex flex-col gap-5">
        <Suspense
          fallback={
            <div className="flex justify-center py-5">
              <Spinner />
            </div>
          }
        >
          <PostPage postId={params.postId} />
        </Suspense>
      </PageContent>
    </HydrateClient>
  );
};

export default Page;
