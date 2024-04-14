import { api } from "@/trpc/server";
import { TopNav } from "../../_components/topnav";
// import { auth } from "@init/auth";
import View from "./view";

const Page = async () => {
  const currentUser = await api.auth.me();
  const user = await api.user.byId({ uid: currentUser?.id ?? "" });

  return (
    <>
      <TopNav />
      <View user={user} />
    </>
  );
};

export default Page;
