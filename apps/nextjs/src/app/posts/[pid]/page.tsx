import Navbar from "@/app/_components/layout/navbar";
import { api } from "@/trpc/server";
import View from "./view";

type Props = {
  params: {
    pid: string;
  };
};

const Page = async ({ params: { pid } }: Props) => {
  const post = await api.posts.byId({ id: pid });
  const currentUser = await api.auth.me();
  const user = await api.user.byEmail({ email: currentUser?.email ?? "" });

  return (
    <>
      <Navbar />
      <View post={post} user={user} pid={pid} />
    </>
  );
};

export default Page;
