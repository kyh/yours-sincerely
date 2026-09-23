import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Spinner } from "@repo/ui/components/spinner";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { fetchOrNotFound, HydrateClient, prefetch, orpc } from "@/orpc/server";
import { Profile } from "../_components/profile";

export const metadata: Metadata = {
  title: "Profile",
};

interface Props {
  params: Promise<{
    userId: string;
  }>;
}

// No loading.tsx for this segment: its Suspense boundary would start the stream
// before the notFound() check, and an unknown profile would answer 200.
const Page = async (props: Props) => {
  const params = await props.params;

  const { user } = await fetchOrNotFound(
    orpc.user.getUser.queryOptions({ input: { userId: params.userId } }),
  );
  if (!user) {
    notFound();
  }

  prefetch(orpc.user.getUserStats.queryOptions({ input: { userId: params.userId } }));
  prefetch(orpc.post.getPostsByUser.queryOptions({ input: { userId: params.userId } }));

  return (
    <HydrateClient>
      <PageHeader title="Profile" />
      <PageContent>
        <Suspense
          fallback={
            <div className="flex justify-center py-5">
              <Spinner />
            </div>
          }
        >
          <Profile userId={params.userId} />
        </Suspense>
      </PageContent>
    </HydrateClient>
  );
};

export default Page;
