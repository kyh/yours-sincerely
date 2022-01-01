import { Link, LoaderFunction, useLoaderData } from "remix";
import { authenticator } from "~/lib/auth/server/middleware/auth.server";
import { getPostList } from "~/lib/post/server/postService.server";
import { Post } from "~/lib/post/data/postSchema";
import { PostContent } from "~/lib/post/ui/PostContent";

type LoaderData = {
  postList: Post[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  const postList = await getPostList(user);

  const data: LoaderData = {
    postList,
  };

  return data;
};

const Page = () => {
  const { postList } = useLoaderData<LoaderData>();

  return (
    <>
      {!!postList.length && (
        <main className="py-5 flex flex-col gap-8">
          {postList.map((post) => (
            <PostContent key={post.id} post={post} />
          ))}
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
      <Link to="/new">start something?</Link>
    </h1>
    <img src="/assets/reading.svg" alt="No posts" width={400} height={300} />
  </main>
);

export default Page;
