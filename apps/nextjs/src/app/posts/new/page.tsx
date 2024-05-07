import { PostForm } from "@/components/posts/post-form";
import { api } from "@/trpc/server";

const Page = async () => {
  const currentUser = await api.auth.me();

  return <PostForm user={currentUser} />;
};

export default Page;
