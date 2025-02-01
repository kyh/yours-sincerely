"use client";

import { CardStack } from "@/app/(app)/posts/_components/card-stack";

const posts = [
  {
    id: "1",
    content:
      "An ephemeral anonymous blog to send each other tiny beautiful letters",
  },
  { id: "2", content: "Notes to no one" },
  {
    id: "3",
    content: "It’s like a magical graffiti wall in a foot traffic part of town",
  },
  { id: "4", content: "I'm signing the cast of a popular kid at school" },
  {
    id: "5",
    content:
      "YS is a public art project with optional anonymity. It's a direct channel to the inner lives of other humans who, in other contexts, rarely reveal such vulnerability",
  },
];

export const AboutPage = () => {
  return (
    <CardStack
      data={posts}
      render={(post) => (
        <div className="word-break flex h-full w-full flex-col">
          <p className="min-h-[50dvh]">{post.content}</p>
          <footer className="mt-auto flex flex-col pt-3 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-1 text-sm italic">
              <span>Yours Sincerely,</span>
              <span>Anonymous</span>
            </div>
          </footer>
        </div>
      )}
    />
  );
};
