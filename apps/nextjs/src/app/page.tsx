// export const runtime = "edge";

import { PageHeader } from "@/components/page-header";
import { api } from "@/trpc/server";
import PostView from "./postview";

const Page = async () => {
  const postList = await api.posts.list({});

  return (
    <>
      <PageHeader title="Home" />
      <PostView postList={postList} />
      <Aside />
    </>
  );
};

export default Page;

const Aside = () => {
  return (
    <aside className="area-aside hidden xl:block">
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
    </aside>
  );
};
