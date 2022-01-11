import { Link, LoaderFunction, useLoaderData } from "remix";
import { ClientOnly } from "remix-utils";
import ReactTooltip from "react-tooltip";
import { isAuthenticated } from "~/lib/auth/server/middleware/auth.server";
import { User } from "~/lib/user/data/userSchema";
import { getPostList } from "~/lib/post/server/postService.server";
import { Post } from "~/lib/post/data/postSchema";
import { PostContent } from "~/lib/post/ui/PostContent";

type LoaderData = {
  postList: Post[];
  user: User | null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await isAuthenticated(request);
  const postList = await getPostList(user);

  const data: LoaderData = {
    postList,
    user,
  };

  return data;
};

const Page = () => {
  const { postList } = useLoaderData<LoaderData>();

  return (
    <>
      {!!postList.length && (
        <main className="flex flex-col gap-8 py-5">
          {postList.map((post) => (
            <PostContent key={post.id} post={post} />
          ))}
          <ClientOnly>
            <ReactTooltip effect="solid" className="tooltip" />
          </ClientOnly>
        </main>
      )}
      {!postList.length && <EmptyPost />}
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
