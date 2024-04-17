import { PageContent, PageHeader } from "@/components/page-layout";
import { api } from "@/trpc/server";
import View from "./view";

type Props = {
  params: {
    pid: string;
  };
};

const Page = async ({ params: { pid } }: Props) => {
  const post = await api.posts.byId({ id: pid });
  const currentUser = await api.auth.me();
  const user = await api.user.byEmail({ email: currentUser?.email ?? "" });

  return (
    <>
      <PageHeader title="Post" />
      <PageContent>
        <View post={post} user={user} pid={pid} />
      </PageContent>
    </>
  );
};

export default Page;
