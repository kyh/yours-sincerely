import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@repo/ui/components/button";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { caller, HydrateClient, prefetch, orpc } from "@/orpc/server";
import { BlockedWriters } from "./_components/blocked-writers";
import { AppearanceSettings, SettingsForm } from "./_components/settings-form";

export const metadata: Metadata = {
  title: "Settings",
};

const Page = async () => {
  const { user } = await caller.auth.workspace();

  if (!user) {
    return (
      <>
        <PageHeader title="Settings" />
        <PageContent className="flex flex-col gap-8">
          <AppearanceSettings className="rounded-md" />
          <Link
            href="/auth/sign-in?next=/settings"
            className={buttonVariants({ className: "self-start" })}
          >
            Sign in
          </Link>
        </PageContent>
      </>
    );
  }

  prefetch(orpc.block.listBlocks.queryOptions());

  return (
    <HydrateClient>
      <PageHeader title="Settings" />
      <PageContent className="flex flex-col gap-8">
        <SettingsForm />
        <BlockedWriters />
      </PageContent>
    </HydrateClient>
  );
};

export default Page;
