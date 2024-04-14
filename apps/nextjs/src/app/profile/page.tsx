// import { createMeta } from "~/lib/core/util/meta";
import { redirect } from "next/navigation";

import { NoProfile } from "@/lib/user/ui/noprofile";
import { api } from "@/trpc/server";
import Navbar from "../_components/layout/navbar";

const Page = async () => {
  const user = await api.auth.me();
  if (user) redirect(`/${user?.id}`);

  return (
    <>
      <Navbar />
      <main className="pt-5">
        <NoProfile />
      </main>
    </>
  );
};

export default Page;
