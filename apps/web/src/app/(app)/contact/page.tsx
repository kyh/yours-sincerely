import type { Metadata } from "next";

import { ProsePage } from "@/components/layout/prose-page";
import { contactPage } from "@/lib/agent/site-pages";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  description: contactPage.description,
  path: contactPage.path,
  title: contactPage.title,
  video: false,
});

const Page = () => <ProsePage page={contactPage} />;

export default Page;
