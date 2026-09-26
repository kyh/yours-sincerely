import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@repo/ui/components/button";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { notificationInfiniteArgs } from "@/lib/notification-query";
import { caller, HydrateClient, prefetchInfinite, orpc } from "@/orpc/server";
import { MarkAllReadButton, NotificationsPage } from "./notifications-page";

export const metadata: Metadata = {
  title: "Notifications",
};

const Page = async () => {
  const { user } = await caller.auth.workspace();

  if (!user) {
    return (
      <>
        <PageHeader title="Notifications" />
        <PageContent className="flex flex-col items-center gap-4 py-5">
          <p className="text-muted-foreground text-center text-sm">
            Sign in to see replies to your love letters.
          </p>
          <Link href="/auth/sign-in?next=/notifications" className={buttonVariants()}>
            Sign in
          </Link>
        </PageContent>
      </>
    );
  }

  prefetchInfinite(orpc.notification.list.infiniteOptions(notificationInfiniteArgs()));

  return (
    <HydrateClient>
      <PageHeader title="Notifications">
        <MarkAllReadButton />
      </PageHeader>
      <PageContent className="flex flex-col gap-5">
        <NotificationsPage />
      </PageContent>
    </HydrateClient>
  );
};

export default Page;
