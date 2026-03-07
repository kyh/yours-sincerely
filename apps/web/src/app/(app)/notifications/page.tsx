import type { Metadata } from "next";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { NotificationsPage } from "./notifications-page";

export const metadata: Metadata = {
  title: "Notifications",
};

const Page = () => (
  <>
    <PageHeader title="Notifications" />
    <PageContent className="flex flex-col gap-5">
      <NotificationsPage />
    </PageContent>
  </>
);

export default Page;
