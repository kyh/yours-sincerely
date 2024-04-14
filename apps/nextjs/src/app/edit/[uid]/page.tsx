import { redirect } from "next/navigation";
import { auth } from "@init/auth";

import { EditProfile } from "@/lib/user/ui/editprofile";
import { api } from "@/trpc/server";

// export let meta: MetaFunction = () => {
//   return createMeta({
//     title: "Edit Profile",
//   });
// };

type Props = {
  params: {
    uid: string;
  };
};

const Page = async ({ params: { uid } }: Props) => {
  const currentUser = await api.auth.me();
  const user = await api.user.byId({ uid: uid });

  const allowEdit = currentUser && user ? currentUser.id === uid : false;

  // if (!user || !allowEdit) redirect(`/${user ? user.id : "/profile"}`);
  if (!user || !allowEdit) redirect(`${"/profile"}`);

  return (
    <main className="mx-auto w-full max-w-md pt-5">
      <EditProfile user={user} />
    </main>
  );
};

export default Page;
