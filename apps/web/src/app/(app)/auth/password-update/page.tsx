import type { Metadata } from "next";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { SetPasswordForm } from "../_components/auth-form";

export const metadata: Metadata = {
  title: "Set New Password",
};

const Page = () => (
  <>
    <PageHeader title="Set New Password" />
    <PageContent className="flex flex-col gap-5">
      <SetPasswordForm />
    </PageContent>
  </>
);

export default Page;
