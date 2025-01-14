// export const runtime = "edge";

import { cookies } from "next/headers";

import {
  PageAside,
  PageContent,
  PageHeader,
} from "@/components/layout/page-layout";
import { getFeedLayout } from "@/lib/feed-layout-actions";
import { api, HydrateClient } from "@/trpc/server";
import { PostFeed } from "./_components/post-feed";
import { PostForm } from "./_components/post-form";

const Page = async () => {
  const cookieStore = await cookies();
  const feedLayout = await getFeedLayout(cookieStore);
  const placeholder = await api.prompt.getRandomPrompt();

  const filters = {
    limit: 5,
  };

  void api.post.getFeed.prefetchInfinite(filters);

  return (
    <HydrateClient>
      <PageHeader title="Home" />
      <PageContent className="flex flex-col gap-5">
        {feedLayout === "list" ? <PostForm placeholder={placeholder} /> : null}
        <PostFeed filters={filters} layout={feedLayout} />
      </PageContent>
      <PageAside>
        <section className="my-6 overflow-auto"></section>
      </PageAside>
    </HydrateClient>
  );
};

export default Page;
