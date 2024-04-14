import { api } from "@/trpc/server";
import PostView from "./postview";

const Page = async () => {
  const postList = await api.posts.list({});

  return (
    <PostView postList={postList} />
  );
};

export default Page;
