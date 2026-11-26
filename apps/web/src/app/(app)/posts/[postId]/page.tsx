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

const loadLetter = async (postId: string) =>
  await fetchOrNotFound(orpc.post.getPost.queryOptions({ input: { postId } }));

export const generateMetadata = async (props: Props) => {
  const { postId } = await props.params;
  const { post } = await loadLetter(postId);

  return letterMetadata(post) satisfies Metadata;
};

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
