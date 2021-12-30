import { Link } from "remix";
import { PostContent } from "~/lib/post/ui/PostContent";

const posts = [
  {
    id: "1",
    content:
      "Matt and I knew that we were planting a flower scheduled for scything. Still, we couldn’t stop ourselves. We museum hopped, savored afternoon scones, explored England’s Suffolk Coast by train. In the sticky summer heat, we bared all, hoping we could evade the blade of my inevitable departure. Love often blooms that way: blind to opportunity, reckless with its velocity and need for nourishment. Now, an ocean apart, as I plan life in Cambridge, Mass., and he remains in Cambridge, England, we know desiccation is unavoidable. Yet, we also know that some plants can survive drought to bloom again.",
    _createdBy: "Jonathan Chan",
  },
  {
    id: "2",
    content:
      "On holiday in America, I became pen pals with a guy who loves Aussie wildlife. Back in Sydney, I told my 85-year-old grandmother I wanted to send him photos of native birds. Weeks later, I received a voice mail message from her, saying, “I took my first photo! It’s a cockatoo for you to send to that boy you like in New York.” It was blurry, and his response wasn’t game-changing, but I’ll always remember that my grandmother learned how to use an iPhone just so she could help me impress a bloke overseas. The ultimate wingwoman.",
    _createdBy: "Hayley Noble",
  },
];

const Page = () => (
  <>
    {!!posts.length && (
      <main className="py-5 flex flex-col gap-8">
        {posts.map((post) => (
          <PostContent key={post.id} post={post} />
        ))}
      </main>
    )}
    {!posts.length && <EmptyPost />}
  </>
);

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
