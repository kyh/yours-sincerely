import { cookies } from "next/headers";
import { cn } from "@kyh/ui/utils";

import { PostFeed } from "@/app/(app)/posts/_components/post-feed";
import {
  NewPostButton,
  PostForm,
} from "@/app/(app)/posts/_components/post-form";
import {
  PageAside,
  PageContent,
  PageHeader,
} from "@/components/layout/page-layout";
import { getFeedLayout } from "@/lib/feed-layout-actions";
import { caller, HydrateClient, prefetch, trpc } from "@/trpc/server";

const Page = async () => {
  const cookieStore = await cookies();
  const feedLayout = await getFeedLayout(cookieStore);
  const placeholder = await caller.prompt.getRandomPrompt();

  const filters = {
    limit: 5,
  };
  prefetch(trpc.post.getFeed.infiniteQueryOptions(filters));

  return (
    <HydrateClient>
      <PageHeader title="Home" />
      <PageContent className="flex flex-col gap-5">
        <div
          className={cn(
            "border-border hidden border-b pb-5",
            feedLayout === "list" && "md:block",
          )}
        >
          <PostForm placeholder={placeholder} />
        </div>
        <PostFeed filters={filters} layout={feedLayout} />
        <div
          className={cn(
            "pointer-events-none fixed right-0 bottom-16 left-0 z-10 md:bottom-5",
            feedLayout === "list" && "md:hidden",
          )}
        >
          <div className="mx-auto flex w-full max-w-(--breakpoint-xl) px-5">
            <div className="pointer-events-auto ml-auto">
              <NewPostButton placeholder={placeholder} />
            </div>
          </div>
        </div>
      </PageContent>
      <PageAside>
        <section className="my-6 overflow-auto"></section>
      </PageAside>
    </HydrateClient>
  );
};

export default Page;
