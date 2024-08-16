import { Badge } from "@init/ui/badge";
import { Button } from "@init/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@init/ui/card";
import { If } from "@init/ui/if";
import { ProfileAvatar } from "@init/ui/profile-avatar";
import { Table, TableBody, TableCell, TableRow } from "@init/ui/table";
import { BadgeX, Ban, ShieldPlus, VenetianMask } from "lucide-react";

import { AdminBanUserDialog } from "@/app/(admin)/_components/admin-ban-user-dialog";
import { AdminDeleteUserDialog } from "@/app/(admin)/_components/admin-delete-user-dialog";
import { AdminImpersonateUserDialog } from "@/app/(admin)/_components/admin-impersonate-user-dialog";
import { AdminReactivateUserDialog } from "@/app/(admin)/_components/admin-reactivate-user-dialog";
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
  const user = await api.admin.getUser({ userId: params.id });

  const isBanned = Boolean(user.bannedUntil);

  return (
    <main className="flex flex-col gap-4 p-5">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <ProfileAvatar
            pictureUrl={user.displayImage}
            displayName={user.displayName}
          />
          <span>{user.displayName}</span>
        </div>

        <If condition={isBanned}>
          <Badge variant="destructive">Banned</Badge>
        </If>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>{user.displayName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>{user.email}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Role</TableCell>
              <TableCell>{user.role}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex space-x-2">
            <If condition={isBanned}>
              <AdminReactivateUserDialog userId={user.id}>
                <Button size="sm" variant="primary">
                  <ShieldPlus className="mr-1 h-4" />
                  Reactivate
                </Button>
              </AdminReactivateUserDialog>
            </If>

            <If condition={!isBanned}>
              <AdminBanUserDialog userId={user.id}>
                <Button size="sm" variant="primary">
                  <Ban className="mr-1 h-4" />
                  Ban
                </Button>
              </AdminBanUserDialog>

              <AdminImpersonateUserDialog userId={user.id}>
                <Button size="sm" variant="outline">
                  <VenetianMask className="mr-1 h-4" />
                  Impersonate
                </Button>
              </AdminImpersonateUserDialog>
            </If>

            <AdminDeleteUserDialog userId={user.id}>
              <Button size="sm" variant="destructive">
                <BadgeX className="mr-1 h-4" />
                Delete
              </Button>
            </AdminDeleteUserDialog>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default Page;
