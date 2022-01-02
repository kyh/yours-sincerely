import { PrivacyTerms } from "~/lib/about/ui/PrivacyTerms";

const quoteClass =
  "relative before:absolute before:block before:-left-3 before:-top-1 before:w-6 before:h-4 before:-z-10 before:opacity-25 before:content-['_'] before:bg-[url('/assets/quote.svg')] before:bg-no-repeat";

const Page = () => (
  <main className="max-w-[25rem] mx-auto flex flex-col gap-5">
    <div className="prose prose-slate dark:prose-invert">
      <h1 className="text-2xl font-bold text-center">About</h1>
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
    </div>
    <p className="text-center">
      <a
        href="https://github.com/kyh/yours-sincerely/issues/new"
        target="_blank"
        rel="noopener noreferrer"
      >
        What is YS to you?
      </a>
    </p>
    <PrivacyTerms />
  </main>
);

export default Page;
