import type { GetUsersInput } from "@init/api/admin/admin-schema";
import { AdminUsersTable } from "@/app/(admin)/_components/admin-users-table";
import { api } from "@/trpc/server";

type SearchParams = GetUsersInput;

export const metadata = {
  title: `Users`,
};

const Page = async ({ searchParams }: { searchParams: SearchParams }) => {
  await api.admin.getUsers.prefetch(searchParams);

  return (
    <main className="flex flex-1 flex-col p-5">
      <AdminUsersTable searchParams={searchParams} />
    </main>
  );
};

export default Page;
