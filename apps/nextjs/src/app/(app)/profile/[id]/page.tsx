import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { Profile } from "../_components/profile";

type Props = {
  params: {
    id: string;
  };
};

const Page = async ({ params: { id } }: Props) => {
  return (
    <>
      <PageHeader title="Profile" />
      <PageContent>
        <Profile id={id} />
      </PageContent>
    </>
  );
};

export default Page;
