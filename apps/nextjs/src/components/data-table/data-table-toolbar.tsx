"use client";

import * as React from "react";
import { Button } from "@init/ui/button";
import { Input } from "@init/ui/input";
import { cn } from "@init/ui/utils";
import { Cross2Icon } from "@radix-ui/react-icons";

import type { Table } from "@tanstack/react-table";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData>
  extends React.HTMLAttributes<HTMLDivElement> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-end space-x-2 overflow-auto p-1",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
