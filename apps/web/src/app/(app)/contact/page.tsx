import type { Metadata } from "next";

import { ProsePage } from "@/components/layout/prose-page";
import { contactPage } from "@/lib/agent/site-pages";

export const metadata: Metadata = {
  alternates: { canonical: contactPage.path },
  description: contactPage.description,
  title: contactPage.title,
};

const Page = () => <ProsePage page={contactPage} />;

export default Page;
