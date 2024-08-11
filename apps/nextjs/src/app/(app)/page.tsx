// export const runtime = "edge";

import {
  PageAside,
  PageContent,
  PageHeader,
} from "@/components/layout/page-layout";
import { api } from "@/trpc/server";
import { PostFeed } from "./posts/_components/post-feed";
import { PostForm } from "./posts/_components/post-form";

const Page = async () => {
  const currentUser = await api.user.me();
  const placeholder = await api.prompt.random();

  return (
    <>
      <PageHeader title="Home" />
      <PageContent>
        <PostForm user={currentUser} placeholder={placeholder} />
        <PostFeed />
      </PageContent>
      <PageAside>
        <section className="my-6 overflow-auto"></section>
      </PageAside>
    </>
  );
};

export default Page;
