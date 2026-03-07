import type { Metadata } from "next";

import { PageContent, PageHeader } from "@/components/layout/page-layout";

export const metadata: Metadata = {
  title: "Maintenance",
};

const Page = () => (
  <section className="mx-auto flex max-w-md flex-col px-5">
    <PageHeader title="Maintenance" className="h-16" />
    <PageContent className="flex flex-col gap-5">
      <h1>
        We're currently undergoing some maintenance and will be back shortly. In
        the meantime, you can bug me on{" "}
        <a className="font-semibold underline" href="https://x.com/kaiyuhsu">
          X
        </a>{" "}
        for a timeline.
      </h1>
    </PageContent>
  </section>
);

export default Page;
