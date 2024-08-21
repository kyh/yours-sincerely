// export const runtime = "edge";

import {
  PageAside,
  PageContent,
  PageHeader,
} from "@/components/layout/page-layout";
import { api, HydrateClient } from "@/trpc/server";
import { PostFeed } from "./_components/post-feed";
import { PostForm } from "./_components/post-form";

const Page = () => {
  void api.prompt.getRandomPrompt.prefetch();
  void api.post.getFeed.prefetchInfinite({});

  return (
    <HydrateClient>
      <PageHeader title="Home" />
      <PageContent>
        <PostForm />
        <PostFeed />
      </PageContent>
      <PageAside>
        <section className="my-6 overflow-auto"></section>
      </PageAside>
    </HydrateClient>
  );
};

export default Page;
