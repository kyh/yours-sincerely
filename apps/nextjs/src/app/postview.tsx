"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Post } from "@/lib/post/data/postschema";
import { useRootHotkeys } from "@/lib/core/util/hotkey";
import { PostContent } from "@/lib/post/ui/postcontent";
import { CardStack } from "./_components/cardstack";
import { useInfiniteScroll } from "./_components/infinitescroll";
import { Spinner } from "./_components/spinner";

type Props = {
  postList: Post[];
};

const PostView = ({ postList }: Props) => {
  const router = useRouter();

  const [view, setView] = useState("STACK");

  useEffect(() => {
    setView(localStorage.getItem("view") ?? "STACK");
  }, []);

  const {
    loadMore,
    hasNextPage,
    ref,
    data: posts,
  } = useInfiniteScroll({
    initialData: postList,
  });

  useRootHotkeys([["c", () => router.push("/posts/new")]]);

  return (
    <>
      {!!posts.length && (
        <section className="divide-y divide-border">
          {view === "STACK" && (
            <CardStack
              data={posts}
              hasNextPage={hasNextPage}
              onLoadMore={loadMore}
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
                  <Spinner loading />
                </div>
              )}
            </>
          )}
        </section>
      )}
      {!posts.length && <EmptyPost />}
    </>
  );
};

const EmptyPost = () => (
  <main className="area-content m-auto max-w-sm text-center">
    <h1 className="text-2xl font-bold">
      {"It's kind of lonely here... could you help "}
      <Link href="/posts/new" className="text-[#8389E1]">
        start something?
      </Link>
    </h1>
    <Image src="/assets/reading.svg" alt="No posts" width={400} height={300} />
  </main>
);

export default PostView;
