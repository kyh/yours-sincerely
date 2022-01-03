import { LoaderFunction, MetaFunction, useLoaderData } from "remix";
import { isAuthenticated } from "~/lib/auth/server/middleware/auth.server";
import { User } from "~/lib/user/data/userSchema";
import { getPost } from "~/lib/post/server/postService.server";
import { Post } from "~/lib/post/data/postSchema";
import { PostContent } from "~/lib/post/ui/PostContent";
import { createMeta } from "~/lib/core/util/meta";

export let meta: MetaFunction = ({
  data,
}: {
  data: LoaderData | undefined;
}) => {
  if (!data || !data.post) {
    return createMeta({
      title: "Invalid Post",
      description: "This post does not exist or is under review",
    });
  }
  return createMeta({
    siteTitle: `Yours Sincerely, ${data.post.createdBy}`,
    description: `A lovely letter by ${data.post.createdBy} which will dissapear into the ether in a few days`,
  });
};

type LoaderData = {
  post: Post | null;
  user: User | null;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await isAuthenticated(request);
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
    <main className="flex flex-col gap-8 py-5">
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
