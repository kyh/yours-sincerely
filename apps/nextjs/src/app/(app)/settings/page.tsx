import type { Metadata } from "next";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { HydrateClient } from "@/trpc/server";
import { AppearanceForm } from "./_components/appearance-form";
import { SettingsForm } from "./_components/settings-form";

export const metadata: Metadata = {
  title: "Settings",
};

export const dynamic = "force-dynamic";

const Page = () => {
  return (
    <HydrateClient>
      <PageHeader title="Settings" />
      <PageContent className="flex flex-col gap-8">
        <SettingsForm />
        <AppearanceForm />
      </PageContent>
    </HydrateClient>
  );
};

export default Page;
