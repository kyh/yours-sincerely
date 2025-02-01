import type { Metadata } from "next";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { AboutPage } from "./about-page";

export const metadata: Metadata = {
  title: "About",
};

const Page = () => (
  <>
    <PageHeader title="About" />
    <PageContent className="flex flex-col gap-5">
      <h1 className="text-center text-sm text-muted-foreground">
        Stories about us, written by you
      </h1>
      <AboutPage />
    </PageContent>
  </>
);

export default Page;
