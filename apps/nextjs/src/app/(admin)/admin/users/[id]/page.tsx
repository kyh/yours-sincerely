import { AdminUserPage } from "@/app/(admin)/_components/admin-user-page";
import { api } from "@/trpc/server";

type Params = {
  params: {
    id: string;
  };
};

export const generateMetadata = async ({ params }: Params) => {
  const user = await api.admin.getUser({ userId: params.id });

  return {
    title: `Admin | ${user.displayName ?? "Anonymous"}`,
  };
};

const Page = async ({ params }: Params) => {
  await api.admin.getUser.prefetch({ userId: params.id });

  return <AdminUserPage userId={params.id} />;
};

export default Page;
