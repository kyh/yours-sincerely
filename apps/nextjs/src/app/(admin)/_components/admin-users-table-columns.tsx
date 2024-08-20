import Link from "next/link";
import { Button } from "@init/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@init/ui/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";

import type { RouterOutputs } from "@init/api";
import type { ColumnDef } from "@tanstack/react-table";
import { AdminImpersonateUserDialog } from "./admin-impersonate-user-dialog";

type User = RouterOutputs["admin"]["getUser"];

export const getColumns = (): ColumnDef<User>[] => [
  {
    id: "name",
    header: "Name",
    cell: ({ row }) => {
      return (
        <Link
          className="hover:underline"
          href={`/admin/users/${row.original.id}`}
        >
          {row.original.displayName}
        </Link>
      );
    },
  },
  {
    id: "email",
    header: "Email",
    accessorKey: "email",
  },
  {
    id: "createdAt",
    header: "Created At",
    accessorKey: "createdAt",
  },
  {
    id: "updatedAt",
    header: "Updated At",
    accessorKey: "updatedAt",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const userId = row.original.id;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              <MoreHorizontalIcon className="h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>
                <Link className="h-full w-full" href={`/admin/users/${userId}`}>
                  View
                </Link>
              </DropdownMenuItem>
              <AdminImpersonateUserDialog userId={userId}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Impersonate User
                </DropdownMenuItem>
              </AdminImpersonateUserDialog>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
