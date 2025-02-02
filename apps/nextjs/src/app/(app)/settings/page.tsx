import type { Metadata } from "next";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { AppearanceForm } from "./_components/appearance-form";
import { SettingsForm } from "./_components/settings-form";

export const metadata: Metadata = {
  title: "Settings",
};

const Page = () => {
  return (
    <>
      <PageHeader title="Settings" />
      <PageContent className="flex flex-col gap-8">
        <SettingsForm />
        <AppearanceForm />
      </PageContent>
    </>
  );
};

export default Page;
