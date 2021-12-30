import { PostContent } from "~/lib/post/ui/PostContent";

const post = {
  content:
    "Matt and I knew that we were planting a flower scheduled for scything. Still, we couldn’t stop ourselves. We museum hopped, savored afternoon scones, explored England’s Suffolk Coast by train. In the sticky summer heat, we bared all, hoping we could evade the blade of my inevitable departure. Love often blooms that way: blind to opportunity, reckless with its velocity and need for nourishment. Now, an ocean apart, as I plan life in Cambridge, Mass., and he remains in Cambridge, England, we know desiccation is unavoidable. Yet, we also know that some plants can survive drought to bloom again.",
  _createdBy: "Jonathan Chan",
};

const Page = () => (
  <main className="py-5 flex flex-col gap-8">
    {post && (
      <PostContent post={post} showLink={false} showTimer={false} showMore />
    )}
    {!post && <p className="text-lg">This post is under review</p>}
  </main>
);

export default Page;
