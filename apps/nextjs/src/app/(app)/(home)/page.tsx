// export const runtime = "edge";

import {
  PageAside,
  PageContent,
  PageHeader,
} from "@/components/layout/page-layout";
import { api, HydrateClient } from "@/trpc/server";
import { PostFeed } from "./_components/post-feed";
import { PostForm } from "./_components/post-form";

const Page = async () => {
  const placeholder = await api.prompt.getRandomPrompt();
  const filters = {
    limit: 5,
  };

  void api.post.getFeed.prefetchInfinite(filters);

  return (
    <HydrateClient>
      <PageHeader title="Home" />
      <PageContent className="flex flex-col gap-5">
        <PostForm placeholder={placeholder} />
        <PostFeed filters={filters} />
      </PageContent>
      <PageAside>
        <section className="my-6 overflow-auto"></section>
      </PageAside>
    </HydrateClient>
  );
};

export default Page;
