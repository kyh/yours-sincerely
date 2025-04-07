"use client";

import { Spinner } from "@kyh/ui/spinner";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import useInfiniteScroll from "react-infinite-scroll-hook";

import type { FeedLayout } from "@/lib/feed-layout-actions";
import { CardStack } from "@/app/(app)/posts/_components/card-stack";
import { PostContent } from "@/app/(app)/posts/_components/post-content";
import { useTRPC } from "@/trpc/react";

type Props = {
  layout?: FeedLayout;
  filters?: {
    userId?: string;
    parentId?: string;
    limit?: number;
  };
};

export const PostFeed = ({ layout = "list", filters = {} }: Props) => {
  const trpc = useTRPC();
  const { data, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(
      trpc.post.getFeed.infiniteQueryOptions(filters, {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }),
    );

  const [ref] = useInfiniteScroll({
    loading: isFetchingNextPage,
    hasNextPage,
    onLoadMore: fetchNextPage,
  });

  const posts = data.pages.flatMap((page) => page.posts);

  return (
    <section className="divide-border flex-1 divide-y">
      {!posts.length && (
        <div className="h-full py-5 text-center text-sm">No posts</div>
      )}
      {posts.length > 0 && layout === "stack" && (
        <CardStack
          data={posts}
          hasNextPage={hasNextPage}
          onLoadMore={fetchNextPage}
          render={(post) => (
            <PostContent
              layout="stack"
              post={post}
              asLink={false}
              showMore={false}
              minHeight
            />
          )}
        />
      )}
      {posts.length > 0 && layout === "list" && (
        <>
          {posts.map((post) => (
            <div key={post.id} className="pt-5 pb-3">
              <PostContent post={post} showMore={false} />
            </div>
          ))}
          {hasNextPage && (
            <div
              className="flex items-center justify-center pt-5 pb-3"
              ref={ref}
            >
              <Spinner />
            </div>
          )}
        </>
      )}
    </section>
  );
};
