"use client";

import { Spinner } from "@init/ui/spinner";
import useInfiniteScroll from "react-infinite-scroll-hook";

import type { FeedLayout } from "@/lib/feed-layout-actions";
import { CardStack } from "@/app/(app)/posts/_components/card-stack";
import { PostContent } from "@/app/(app)/posts/_components/post-content";
import { api } from "@/trpc/react";

type Props = {
  layout?: FeedLayout;
  filters?: {
    userId?: string;
    parentId?: string;
    limit?: number;
    cursor?: string;
  };
};

export const PostFeed = ({ layout = "list", filters = {} }: Props) => {
  const [data, { isFetchingNextPage, hasNextPage, fetchNextPage }] =
    api.post.getFeed.useSuspenseInfiniteQuery(filters, {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

  const [ref] = useInfiniteScroll({
    loading: isFetchingNextPage,
    hasNextPage,
    onLoadMore: fetchNextPage,
  });

  const posts = data.pages.flatMap((page) => page.posts);

  return (
    <section className="flex-1 divide-y divide-border">
      {!posts.length && (
        <div className="h-full py-5 text-center text-sm">No posts</div>
      )}
      {posts.length > 0 && layout === "stack" && (
        <CardStack
          data={posts}
          hasNextPage={hasNextPage}
          onLoadMore={fetchNextPage}
        >
          {(post) => (
            <PostContent
              layout="stack"
              post={post}
              asLink={false}
              showMore={false}
              minHeight
            />
          )}
        </CardStack>
      )}
      {posts.length > 0 && layout === "list" && (
        <>
          {posts.map((post) => (
            <div key={post.id} className="pb-3 pt-5">
              <PostContent post={post} showMore={false} />
            </div>
          ))}
          {hasNextPage && (
            <div
              className="flex items-center justify-center pb-3 pt-5"
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
