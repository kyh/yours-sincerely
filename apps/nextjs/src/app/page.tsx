// export const runtime = "edge";

import {
  PageAside,
  PageContent,
  PageHeader,
} from "@/components/layout/page-layout";
import { PostForm } from "@/components/post/post-form";
import { PostsFeed } from "@/components/post/posts-feed";
import { api } from "@/trpc/server";

const Page = async () => {
  const currentUser = await api.account.me();
  const placeholder = await api.prompt.random();

  return (
    <>
      <PageHeader title="Home" />
      <PageContent>
        <PostForm user={currentUser} placeholder={placeholder} />
        <PostsFeed />
      </PageContent>
      <PageAside>
        <section className="my-6 overflow-auto"></section>
      </PageAside>
    </>
  );
};

export default Page;
