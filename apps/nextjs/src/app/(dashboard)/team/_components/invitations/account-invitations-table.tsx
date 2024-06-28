"use client";

import { useMemo, useState } from "react";
import { Input } from "@init/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@init/ui/table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import type { RouterOutputs } from "@init/api";
import { getColumns } from "./account-invitations-table-columns";

type Invitations = RouterOutputs["team"]["invitations"];

type AccountInvitationsTableProps = {
  invitations: Invitations;

  permissions: {
    canUpdateInvitation: boolean;
    canRemoveInvitation: boolean;
    currentUserRoleHierarchy: number;
  };
};

export function AccountInvitationsTable({
  invitations,
  permissions,
}: AccountInvitationsTableProps) {
  const [search, setSearch] = useState("");
  const columns = useMemo(() => getColumns(permissions), [permissions]);

  const filteredInvitations = invitations.filter((member) => {
    const searchString = search.toLowerCase();
    const email = member.email.split("@")[0]?.toLowerCase() ?? "";

    return (
      email.includes(searchString) ||
      member.role.toLowerCase().includes(searchString)
    );
  });

  const table = useReactTable({
    data: filteredInvitations,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={"flex flex-col space-y-2"}>
      <Input
        value={search}
        onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
        placeholder={"Search Invitations"}
      />

      <div className={"rounded-md border"}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-row-id={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className={"h-24 text-center"}
                >
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
