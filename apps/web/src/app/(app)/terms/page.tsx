import type { Metadata } from "next";

import { ProsePage } from "@/components/layout/prose-page";
import { termsPage } from "@/lib/agent/site-pages";
import { pageCardMetadata } from "@/lib/seo";

export const metadata: Metadata = pageCardMetadata("terms");

const Page = () => <ProsePage page={termsPage} />;

export default Page;
