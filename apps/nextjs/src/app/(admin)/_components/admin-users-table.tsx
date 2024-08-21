"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DataTable } from "@init/ui/data-table/data-table";
import { Form, FormControl, FormField, FormItem, useForm } from "@init/ui/form";
import { Input } from "@init/ui/input";
import { z } from "zod";

import type { GetUsersInput } from "@init/api/admin/admin-schema";
import { useDataTable } from "@/lib/use-data-table";
import { api } from "@/trpc/react";
import { getColumns } from "./admin-users-table-columns";

const FiltersSchema = z.object({
  query: z.string().optional(),
});

export const AdminUsersTable = (
  props: React.PropsWithChildren<{
    searchParams: GetUsersInput;
  }>,
) => {
  const [{ data, pageCount }] = api.admin.getUsers.useSuspenseQuery(props.searchParams);

  const columns = useMemo(() => getColumns(), []);

  const { table } = useDataTable({
    data,
    columns,
    pageCount: pageCount,
    // optional props
    defaultSort: "createdAt.desc",
  });

  return (
    <div className="flex flex-col space-y-4">
      <UsersTableFilters />
      <DataTable table={table} />
    </div>
  );
};

const UsersTableFilters = () => {
  const form = useForm({
    schema: FiltersSchema,
    defaultValues: {
      query: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const router = useRouter();
  const pathName = usePathname();

  const onSubmit = ({ query }: z.infer<typeof FiltersSchema>) => {
    const params = new URLSearchParams({
      query: query ?? "",
    });

    const url = `${pathName}?${params.toString()}`;

    router.push(url);
  };

  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex space-x-4">
        <Form {...form}>
          <form
            className="flex space-x-4"
            onSubmit={form.handleSubmit((data) => onSubmit(data))}
          >
            <FormField
              name="query"
              render={({ field }) => (
                <FormItem>
                  <FormControl className="w-full min-w-36 md:min-w-72">
                    <Input
                      className="w-full"
                      placeholder="Search user..."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
    </div>
  );
};
