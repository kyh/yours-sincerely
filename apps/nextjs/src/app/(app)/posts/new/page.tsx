import { api } from "@/trpc/server";
import { PostForm } from "../_components/post-form";

const Page = async () => {
  const currentUser = await api.account.me();

  return <PostForm user={currentUser} />;
};

export default Page;
