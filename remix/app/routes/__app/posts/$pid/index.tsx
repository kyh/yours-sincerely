import { LoaderFunction, MetaFunction, useLoaderData } from "remix";
import { authenticator } from "~/lib/auth/server/middleware/auth.server";
import { User } from "~/lib/user/data/userSchema";
import { getPost } from "~/lib/post/server/postService.server";
import { Post } from "~/lib/post/data/postSchema";
import { PostContent } from "~/lib/post/ui/PostContent";

export let meta: MetaFunction = ({
  data,
}: {
  data: LoaderData | undefined;
}) => {
  if (!data || !data.post) {
    return {
      title: "Invalid Post",
      description: "This post does not exist or is under review",
    };
  }
  return {
    title: `Yours Sincerely, ${data.post.createdBy}`,
    description: `A lovely letter by ${data.post.createdBy} which will dissapear into the ether in a few days`,
  };
};

type LoaderData = {
  post: Post | null;
  user: User | null;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await authenticator.isAuthenticated(request);
  const post = await getPost({ id: params.pid }, user);

  const data: LoaderData = {
    post,
    user,
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
