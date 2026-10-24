import type { Metadata } from "next";

import { ProsePage } from "@/components/layout/prose-page";
import { privacyPage } from "@/lib/agent/site-pages";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  description: privacyPage.description,
  path: privacyPage.path,
  title: privacyPage.title,
  video: false,
});

const Page = () => <ProsePage page={privacyPage} />;

export default Page;
