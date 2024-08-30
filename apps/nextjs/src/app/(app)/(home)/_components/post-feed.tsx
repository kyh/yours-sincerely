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
    <section className="divide-y divide-border">
      {!posts.length && (
        <div className="py-5 text-center">No posts available</div>
      )}
      {posts.length > 0 && view === "STACK" && (
        <CardStack
          data={posts}
          hasNextPage={hasNextPage}
          onLoadMore={fetchNextPage}
        >
          {(post) => <PostContent displayFull asLink={false} post={post} />}
        </CardStack>
      )}
      {posts.length > 0 && view === "LIST" && (
        <>
          {posts.map((post) => (
            <div key={post.id} className="py-5">
              <PostContent post={post} />
            </div>
          ))}
          {hasNextPage && (
            <div className="flex items-center justify-center py-5" ref={ref}>
              <Spinner />
            </div>
          )}
        </>
      )}
    </section>
  );
};
