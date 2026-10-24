import type { Metadata } from "next";

import { ProsePage } from "@/components/layout/prose-page";
import { termsPage } from "@/lib/agent/site-pages";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  description: termsPage.description,
  path: termsPage.path,
  title: termsPage.title,
  video: false,
});

const Page = () => <ProsePage page={termsPage} />;

export default Page;
