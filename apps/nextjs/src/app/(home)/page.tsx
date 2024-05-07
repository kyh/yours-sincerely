// export const runtime = "edge";

import {
  PageAside,
  PageContent,
  PageHeader,
} from "@/components/layout/page-layout";
import { api } from "@/trpc/server";
import PostView from "./postview";

const Page = async () => {
  const postList = await api.posts.list({});

  return (
    <>
      <PageHeader title="Home" />
      <PageContent>
        <form className="flex flex-col gap-2">
          <textarea placeholder="What's on your mind?" />
          <footer>
            <button type="submit">Post</button>
          </footer>
        </form>
        <PostView postList={postList} />
      </PageContent>
      <PageAside>
        <section
          aria-labelledby="comments-section"
          className="my-6 overflow-auto"
        >
          <h2
            id="comments-section"
            className="sticky top-0 mb-0 bg-gradient-to-b from-white pb-2 text-lg"
          >
            Comments
          </h2>
        </section>
      </PageAside>
    </>
  );
};

export default Page;
