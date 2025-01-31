import type { Metadata } from "next";

import { PageContent, PageHeader } from "@/components/layout/page-layout";

export const metadata: Metadata = {
  title: "About",
};

const Page = () => (
  <>
    <PageHeader title="About" />
    <PageContent className="flex flex-col gap-5">
      <p>
        An ephemeral anonymous blog to send each other tiny beautiful letters
      </p>
      <p>Notes to no one</p>
      <p>It’s like a magical graffiti wall in a foot traffic part of town</p>
      <p>Like signing the cast of a popular kid at school</p>
      <p>
        YS is a public art project with optional anonymity. It is also a direct
        channel to the inner lives of other humans who, in other contexts,
        rarely reveal such vulnerability
      </p>
    </PageContent>
  </>
);

export default Page;
