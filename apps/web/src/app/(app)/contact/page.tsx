import type { Metadata } from "next";

import { ProsePage } from "@/components/layout/prose-page";
import { contactPage } from "@/lib/agent/site-pages";
import { pageCardMetadata } from "@/lib/seo";

export const metadata: Metadata = pageCardMetadata("contact");

const Page = () => <ProsePage page={contactPage} />;

export default Page;
