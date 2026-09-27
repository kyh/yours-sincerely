import { Spinner } from "@repo/ui/components/spinner";

import { PageContent, PageHeader } from "@/components/layout/page-layout";

const Loading = () => (
  <>
    <PageHeader title="Notifications" />
    <PageContent className="flex justify-center py-5">
      <Spinner />
    </PageContent>
  </>
);

export default Loading;
