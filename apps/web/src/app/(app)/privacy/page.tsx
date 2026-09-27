import type { Metadata } from "next";

import { ProsePage } from "@/components/layout/prose-page";
import { privacyPage } from "@/lib/agent/site-pages";

export const metadata: Metadata = {
  alternates: { canonical: privacyPage.path },
  description: privacyPage.description,
  title: privacyPage.title,
};

const Page = () => <ProsePage page={privacyPage} />;

export default Page;
