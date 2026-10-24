import { Suspense } from "react";
import type { Metadata } from "next";
import { Spinner } from "@repo/ui/components/spinner";

import { JsonLd } from "@/components/json-ld";
import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { buildLetterGraph } from "@/lib/agent/structured-data";
import { isLetterIndexable, letterImagePath, letterMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { fetchOrNotFound, HydrateClient, orpc } from "@/orpc/server";
import { PostPage } from "./post-page";

interface Props {
  params: Promise<{
    postId: string;
  }>;
}

// The same query the page awaits: the request's query client serves it once.
const loadLetter = (postId: string) =>
  fetchOrNotFound(orpc.post.getPost.queryOptions({ input: { postId } }));

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { postId } = await props.params;
  const { post } = await loadLetter(postId);
  return letterMetadata(post);
};

// No loading.tsx for this segment: its Suspense boundary would start the stream
// before the notFound() check, and a dead share link would answer 200.
const Page = async (props: Props) => {
  const params = await props.params;

  const { post } = await loadLetter(params.postId);

  return (
    <HydrateClient>
      {isLetterIndexable(post) && (
        <JsonLd node={buildLetterGraph(post, `${siteConfig.url}${letterImagePath(post.id)}`)} />
      )}
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
