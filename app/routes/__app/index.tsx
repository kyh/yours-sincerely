import { json, LoaderArgs } from "@remix-run/node";
import {
  Link,
  useLoaderData,
  useNavigate,
  useOutletContext,
} from "@remix-run/react";
import { useRootHotkeys } from "~/lib/core/util/hotkey";
import { isAuthenticated } from "~/lib/auth/server/authenticator.server";
import { getPostList } from "~/lib/post/server/postService.server";
import { PostContent } from "~/lib/post/ui/PostContent";
import { useInfiniteScroll } from "~/lib/core/ui/InfiniteScroll";
import { CardStack } from "~/lib/core/ui/CardStack";

export const loader = async ({ request }: LoaderArgs) => {
  const user = await isAuthenticated(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("c");
  const postList = await getPostList(user, { cursor });

  return json({
    postList,
    user,
  });
};

const Page = () => {
  const navigate = useNavigate();
  const { view } = useOutletContext<{ view: "list" | "stack" }>();
  const { postList } = useLoaderData<typeof loader>();
  const {
    fetcher,
    loadMore,
    hasNextPage,
    ref,
    data: posts,
  } = useInfiniteScroll({
    initialData: postList,
    fetcherResultKey: "postList",
  });

  useRootHotkeys([["c", () => navigate("/posts/new")]]);

  return (
    <>
      {!!posts.length && (
        <main
          className={`flex flex-col gap-8 ${view === "stack" ? "" : "py-5"}`}
        >
          {view === "stack" && (
            <CardStack
              data={posts}
              hasNextPage={hasNextPage}
              onLoadMore={loadMore}
            >
              {(post) => <PostContent displayFull asLink={false} post={post} />}
            </CardStack>
          )}
          {view === "list" && (
            <>
              {posts.map((post) => (
                <PostContent key={post.id} post={post} />
              ))}
              {fetcher.state === "idle" && hasNextPage && (
                <div className="text-center" ref={ref}>
                  Loading...
                </div>
              )}
            </>
          )}
        </main>
      )}
      {!posts.length && <EmptyPost />}
    </>
  );
};

const EmptyPost = () => (
  <main className="max-w-sm m-auto text-center">
    <h1 className="text-2xl font-bold">
      It's kind of lonely here... could you help{" "}
      <Link to="/posts/new">start something?</Link>
    </h1>
    <img src="/assets/reading.svg" alt="No posts" width={400} height={300} />
  </main>
);

export default Page;
