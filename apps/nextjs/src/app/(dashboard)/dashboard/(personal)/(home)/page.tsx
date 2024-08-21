import type { GetTaskListInput } from "@init/api/task/task-schema";
import { PageHeader } from "@/components/header";
import { api, HydrateClient } from "@/trpc/server";
import { TasksTable } from "./_components/tasks-table";

type SearchParams = GetTaskListInput;

const Page = async ({ searchParams }: { searchParams: SearchParams }) => {
  const { user } = await api.account.userWorkspace();

  void api.task.getTaskList.prefetch({
    ...searchParams,
    accountId: user.id,
  });

  return (
    <HydrateClient>
      <main className="flex flex-1 flex-col px-5">
        <PageHeader>Welcome back</PageHeader>
        <TasksTable accountId={user.id} searchParams={searchParams} />
      </main>
    </HydrateClient>
  );
};

export default Page;
