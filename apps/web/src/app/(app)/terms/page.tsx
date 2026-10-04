import type { Metadata } from "next";

import { ProsePage } from "@/components/layout/prose-page";
import { termsPage } from "@/lib/agent/site-pages";

export const metadata: Metadata = {
  alternates: { canonical: termsPage.path },
  description: termsPage.description,
  title: termsPage.title,
};

const Page = () => <ProsePage page={termsPage} />;

export default Page;
