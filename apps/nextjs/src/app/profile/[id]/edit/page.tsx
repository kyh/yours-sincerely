import { redirect } from "next/navigation";

import { EditProfile } from "@/lib/user/ui/editprofile";
import { api } from "@/trpc/server";

// export let meta: MetaFunction = () => {
//   return createMeta({
//     title: "Edit Profile",
//   });
// };

type Props = {
  params: {
    id: string;
  };
};

const Page = async ({ params: { id } }: Props) => {
  const currentUser = await api.account.me();
  const user = await api.user.byId({ id: id });

  const allowEdit = currentUser && user ? currentUser.id === id : false;

  // if (!user || !allowEdit) redirect(`/${user ? user.id : "/profile"}`);
  if (!user || !allowEdit) redirect(`${"/profile"}`);

  return (
    <main className="mx-auto w-full max-w-md pt-5">
      <EditProfile user={user} />
    </main>
  );
};

export default Page;
