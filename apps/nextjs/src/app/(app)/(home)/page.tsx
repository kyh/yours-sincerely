// export const runtime = "edge";

import { cookies } from "next/headers";
import { cn } from "@init/ui/utils";

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
import { api, HydrateClient } from "@/trpc/server";

const Page = async () => {
  const cookieStore = await cookies();
  const feedLayout = await getFeedLayout(cookieStore);
  const placeholder = await api.prompt.getRandomPrompt();

  const filters = {
    limit: 5,
  };

  void api.post.getFeed.prefetchInfinite(filters);

  return (
    <HydrateClient>
      <PageHeader title="Home" />
      <PageContent className="flex flex-col gap-5">
        <div
          className={cn(
            "hidden border-b border-border pb-5",
            feedLayout === "list" && "md:block",
          )}
        >
          <PostForm placeholder={placeholder} />
        </div>
        <PostFeed filters={filters} layout={feedLayout} />
        <div
          className={cn(
            "pointer-events-none fixed bottom-16 left-0 right-0 z-10 md:bottom-5",
            feedLayout === "list" && "md:hidden",
          )}
        >
          <div className="mx-auto flex w-full max-w-screen-xl px-5">
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
