// export const runtime = "edge";

import {
  PageAside,
  PageContent,
  PageHeader,
} from "@/components/layout/page-layout";
import { api } from "@/trpc/server";
import { PostFeed } from "./posts/_components/post-feed";
import { PostForm } from "./posts/_components/post-form";

const Page = () => {
  void api.user.me.prefetch();
  void api.prompt.getRandomPrompt.prefetch();
  void api.post.getFeed.prefetchInfinite({});

  return (
    <>
      <PageHeader title="Home" />
      <PageContent>
        <PostForm />
        <PostFeed />
      </PageContent>
      <PageAside>
        <section className="my-6 overflow-auto"></section>
      </PageAside>
    </>
  );
};

export default Page;
