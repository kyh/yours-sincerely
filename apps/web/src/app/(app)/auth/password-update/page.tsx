import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { SetPasswordForm } from "../_components/auth-form";

export const metadata: Metadata = {
  title: "Set New Password",
};

const Page = async ({ searchParams }: { searchParams: Promise<{ token?: string }> }) => {
  const { token } = await searchParams;

  if (!token) {
    redirect("/auth/password-reset");
  }

  return (
    <>
      <PageHeader title="Set New Password" />
      <PageContent className="flex flex-col gap-5">
        <SetPasswordForm token={token} />
      </PageContent>
    </>
  );
};

export default Page;
