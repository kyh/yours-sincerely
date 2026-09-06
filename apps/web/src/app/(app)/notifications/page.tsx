import type { Metadata } from "next";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { notificationInfiniteArgs } from "@/lib/notification-query";
import { caller, HydrateClient, prefetch, prefetchInfinite, orpc } from "@/orpc/server";
import { MarkAllReadButton, NotificationsPage } from "./notifications-page";

export const metadata: Metadata = {
  title: "Notifications",
};

const Page = async () => {
  const { user } = await caller.auth.workspace();

  // Both procedures are protected: prefetching signed-out would dehydrate a
  // rejected query for a page that renders nothing anyway.
  if (user) {
    prefetch(orpc.notification.unreadCount.queryOptions());
    prefetchInfinite(orpc.notification.list.infiniteOptions(notificationInfiniteArgs()));
  }

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
