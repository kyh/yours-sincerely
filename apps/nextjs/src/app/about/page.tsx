import { PageContent, PageHeader } from "@/components/page-layout";

// import { createMeta } from "~/lib/core/util/meta";

// export let meta: MetaFunction = () => {
//   return createMeta({
//     title: "About",
//   });
// };

const quoteClass =
  "relative before:absolute before:block before:-left-3 before:-top-1 before:w-6 before:h-4 before:-z-10 before:opacity-25 before:content-['_'] before:bg-[url('/assets/quote.svg')] before:bg-no-repeat";

const Page = () => (
  <>
    <PageHeader title="About" />
    <PageContent className="flex flex-col gap-6">
      <p className={quoteClass}>
        An ephemeral anonymous blog to send each other tiny beautiful letters
      </p>
      <p className={quoteClass}>Notes to no one</p>
      <p className={quoteClass}>
        It’s like a magical graffiti wall in a foot traffic part of town
      </p>
      <p className={quoteClass}>
        Like signing the cast of a popular kid at school
      </p>
      <p className={quoteClass}>
        YS is a public art project with optional anonymity. It is also a direct
        channel to the inner lives of other humans who, in other contexts,
        rarely reveal such vulnerability
      </p>
    </PageContent>
  </>
);

export default Page;
