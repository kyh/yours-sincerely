import { PostForm } from "@/components/post/post-form";
import { api } from "@/trpc/server";

const Page = async () => {
  const currentUser = await api.account.me();

  return <PostForm user={currentUser} />;
};

export default Page;
