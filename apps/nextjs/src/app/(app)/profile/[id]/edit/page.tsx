import { redirect } from "next/navigation";

import { api } from "@/trpc/server";
import { EditProfile } from "../../_components/edit-profile";

type Props = {
  params: {
    id: string;
  };
};

const Page = async ({ params: { id } }: Props) => {
  const currentUser = await api.account.me();

  const allowEdit = currentUser ? currentUser.id === id : false;

  if (!allowEdit) redirect(`/`);

  return (
    <main className="mx-auto w-full max-w-md pt-5">
      <EditProfile id={id} />
    </main>
  );
};

export default Page;
