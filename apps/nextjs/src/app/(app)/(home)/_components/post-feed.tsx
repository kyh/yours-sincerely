"use client";

import { Spinner } from "@init/ui/spinner";
import useInfiniteScroll from "react-infinite-scroll-hook";

import { CardStack } from "@/app/(app)/posts/_components/card-stack";
import { PostContent } from "@/app/(app)/posts/_components/post-content";
import { api } from "@/trpc/react";

type Props = {
  view?: "STACK" | "LIST";
  filters?: {
    userId?: string;
    parentId?: string;
    limit?: number;
    cursor?: string;
  };
};

export const PostFeed = ({ view = "LIST", filters = {} }: Props) => {
  const { data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    api.post.getFeed.useInfiniteQuery(filters, {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

  const [ref] = useInfiniteScroll({
    loading: isFetchingNextPage,
    hasNextPage,
    onLoadMore: fetchNextPage,
  });

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <section className="divide-y divide-border">
      {view === "STACK" && (
        <CardStack
          data={posts}
          hasNextPage={hasNextPage}
          onLoadMore={fetchNextPage}
        >
          {(post) => <PostContent displayFull asLink={false} post={post} />}
        </CardStack>
      )}
      {view === "LIST" && (
        <>
          {posts.map((post) => (
            <div key={post.id} className="py-5">
              <PostContent post={post} />
            </div>
          ))}
          {hasNextPage && (
            <div className="flex items-center justify-center" ref={ref}>
              <Spinner />
            </div>
          )}
        </>
      )}
    </section>
  );
};
