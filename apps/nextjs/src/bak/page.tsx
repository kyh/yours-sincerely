// export const runtime = "edge";

import { PageHeader } from "@/components/page-header";

const Page = async () => {
  return (
    <>
      <PageHeader title="Home" />
      <main className="area-content space-y-5">
        {[...Array(30).keys()].map((_, index) => (
          <p key={index}>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Sint
            repellendus reiciendis voluptatum dignissimos natus quae ipsum nobis
            voluptatibus eligendi consequuntur est aliquid facilis tenetur et
            nulla, repudiandae illum earum! Quaerat.
          </p>
        ))}
      </main>
      <Aside />
    </>
  );
};

export default Page;

const Aside = () => {
  return (
    <aside className="area-aside hidden xl:block">
      <section
        aria-labelledby="comments-section"
        className="my-6 overflow-auto"
      >
        <h2
          id="comments-section"
          className="sticky top-0 mb-0 bg-gradient-to-b from-white pb-2 text-lg"
        >
          Comments
        </h2>
      </section>
    </aside>
  );
};
