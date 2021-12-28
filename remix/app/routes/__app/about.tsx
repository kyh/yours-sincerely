import { PrivacyTerms } from "~/lib/about/ui/PrivacyTerms";

const Page = () => (
  <main className="max-w-[25rem] mx-auto flex flex-col gap-5">
    <div className="prose prose-slate">
      <h1 className="text-2xl font-bold text-center">About</h1>
      <p className="quote">
        An ephemeral anonymous blog to send each other tiny beautiful letters
      </p>
      <p className="quote">Notes to no one</p>
      <p className="quote">
        It’s like a magical graffiti wall in a foot traffic part of town
      </p>
      <p className="quote">Like signing the cast of a popular kid at school</p>
      <p className="quote">
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
