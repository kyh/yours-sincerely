import type { Metadata } from "next";
import { Card } from "@init/ui/card";

import { PageContent, PageHeader } from "@/components/layout/page-layout";

export const metadata: Metadata = {
  title: "About",
};

const Page = () => (
  <>
    <PageHeader title="About" />
    <PageContent className="flex flex-wrap gap-5">
      <Card className="max-w-sm">
        <p>
          An ephemeral anonymous blog to send each other tiny beautiful letters
        </p>
        <div className="flex items-center gap-1 text-sm italic">
          <span>Yours Sincerely,</span>
          <span>Anonymous</span>
        </div>
      </Card>
      <Card className="max-w-xs">
        <p>Notes to no one</p>
        <div className="flex items-center gap-1 text-sm italic">
          <span>Yours Sincerely,</span>
          <span>Anonymous</span>
        </div>
      </Card>
      <Card className="max-w-xs">
        <p>It’s like a magical graffiti wall in a foot traffic part of town</p>
        <div className="flex items-center gap-1 text-sm italic">
          <span>Yours Sincerely,</span>
          <span>Anonymous</span>
        </div>
      </Card>
      <Card className="max-w-xs">
        <p>I'm signing the cast of a popular kid at school</p>
        <div className="flex items-center gap-1 text-sm italic">
          <span>Yours Sincerely,</span>
          <span>Anonymous</span>
        </div>
      </Card>
      <Card className="max-w-xs">
        <p>
          YS is a public art project with optional anonymity. It's a direct
          channel to the inner lives of other humans who, in other contexts,
          rarely reveal such vulnerability
        </p>
        <div className="flex items-center gap-1 text-sm italic">
          <span>Yours Sincerely,</span>
          <span>Anonymous</span>
        </div>
      </Card>
    </PageContent>
  </>
);

export default Page;
