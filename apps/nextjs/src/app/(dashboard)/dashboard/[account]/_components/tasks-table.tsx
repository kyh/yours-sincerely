"use client";

import { useMemo } from "react";
import { RouterOutputs } from "@init/api";
import { DataTable } from "@init/ui/data-table/data-table";
import { DataTableToolbar } from "@init/ui/data-table/data-table-toolbar";

import type { RetrieveInput } from "@init/api/task/task-schema";
import { useDataTable } from "@/hooks/use-data-table";
import { api } from "@/trpc/react";
import { getColumns } from "./tasks-table-columns";
import { TasksTableToolbarActions } from "./tasks-table-toolbar-actions";

type TasksTableProps = {
  accountId: string;
  searchParams: RetrieveInput;
};

export const TasksTable = ({ accountId, searchParams }: TasksTableProps) => {
  const [data] = api.task.retrieve.useSuspenseQuery({
    ...searchParams,
    accountId: accountId,
  });

  const columns = useMemo(() => getColumns(), []);

  const { table } = useDataTable({
    data: data.data,
    columns,
    pageCount: data.pageCount,
    // optional props
    defaultPerPage: 10,
    defaultSort: "created_at.desc",
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        <TasksTableToolbarActions accountId={accountId} table={table} />
      </DataTableToolbar>
    </DataTable>
  );
};
