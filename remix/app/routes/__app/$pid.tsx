import { LoaderFunction, useLoaderData } from "remix";
import { PostContent } from "~/lib/post/ui/PostContent";
import { authenticator } from "~/lib/auth/server/middleware/auth.server";
import { getPost } from "~/lib/post/server/postService.server";
import { Post } from "~/lib/post/data/postSchema";

type LoaderData = {
  post: Post | null;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await authenticator.isAuthenticated(request);
  const post = await getPost({ id: params.pid }, user);

  const data: LoaderData = {
    post,
  };

  return data;
};

const Page = () => {
  const { post } = useLoaderData<LoaderData>();

  return (
    <main className="py-5 flex flex-col gap-8">
      {post && (
        <PostContent post={post} showLink={false} showTimer={false} showMore />
      )}
      {!post && (
        <p className="text-lg">This post does not exist or is under review</p>
      )}
    </main>
  );
};

export default Page;
