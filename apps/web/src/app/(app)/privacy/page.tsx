import type { Metadata } from "next";

import { ProsePage } from "@/components/layout/prose-page";
import { privacyPage } from "@/lib/agent/site-pages";
import { pageCardMetadata } from "@/lib/seo";

export const metadata: Metadata = pageCardMetadata("privacy");

const Page = () => <ProsePage page={privacyPage} />;

export default Page;
