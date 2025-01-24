import type { Metadata } from "next";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { UpdatePasswordForm } from "../_components/auth-form";

export const metadata: Metadata = {
  title: "Update Password",
};

const Page = () => (
  <>
    <PageHeader title="Update Password" />
    <PageContent className="flex flex-col gap-5">
      <UpdatePasswordForm />
    </PageContent>
  </>
);

export default Page;
