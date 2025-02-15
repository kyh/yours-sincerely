import type { Metadata } from "next";
import Image from "next/image";
import { Card } from "@init/ui/card";

import { PageContent, PageHeader } from "@/components/layout/page-layout";

export const metadata: Metadata = {
  title: "About",
};

const Page = () => (
  <>
    <PageHeader title="About" />
    <PageContent className="flex flex-col gap-5">
      <h1 className="text-muted-foreground text-center text-sm">
        Stories about us, written by you
      </h1>
      <section className="flex flex-wrap gap-5">
        <Card className="h-fit -rotate-2 sm:w-1/2">
          <p>
            An ephemeral anonymous blog to send each other tiny beautiful
            letters
          </p>
          <footer className="flex items-center gap-1 text-sm italic">
            <span>Yours Sincerely,</span>
            <span>Anonymous</span>
          </footer>
          <div className="h-10">
            <Image
              className="dark-purple:invert absolute right-1 -bottom-1 scale-x-[-1] opacity-30 dark:invert"
              src="characters/lion.svg"
              alt="Anonymous user"
              width={70}
              height={100}
            />
          </div>
        </Card>
        <Card className="ml-auto h-fit rotate-2">
          <p>Notes to no one</p>
          <footer className="flex items-center gap-1 text-sm italic">
            <span>Yours Sincerely,</span>
            <span>Anonymous</span>
          </footer>
          <div className="h-7">
            <Image
              className="dark-purple:invert absolute -bottom-2 -left-2 opacity-30 dark:invert"
              src="characters/bunny.svg"
              alt="Anonymous user"
              width={50}
              height={50}
            />
          </div>
        </Card>
        <Card className="relative h-fit w-full">
          <p>
            It’s like a magical graffiti wall in a foot traffic part of town
          </p>
          <footer className="flex items-center gap-1 text-sm italic">
            <span>Yours Sincerely,</span>
            <span>Anonymous</span>
          </footer>
          <div className="h-4">
            <Image
              className="dark-purple:invert absolute right-10 bottom-2 opacity-30 dark:invert"
              src="characters/seal.svg"
              alt="Anonymous user"
              width={100}
              height={150}
            />
          </div>
        </Card>
        <Card className="h-fit -rotate-2">
          <p>I'm signing the cast of a popular kid at school</p>
          <footer className="flex items-center gap-1 text-sm italic">
            <span>Yours Sincerely,</span>
            <span>Anonymous</span>
          </footer>
          <div className="h-4">
            <Image
              className="dark-purple:invert absolute -right-3 -bottom-2 opacity-30 dark:invert"
              src="characters/sloth.svg"
              alt="Anonymous user"
              width={100}
              height={150}
            />
          </div>
        </Card>
        <Card className="ml-auto h-fit w-2/3 rotate-1">
          <p>
            YS is a public art project with optional anonymity. It's a direct
            channel to the inner lives of other humans who, in other contexts,
            rarely reveal such vulnerability
          </p>
          <footer className="flex items-center gap-1 text-sm italic">
            <span>Yours Sincerely,</span>
            <span>Anonymous</span>
          </footer>
          <div className="h-10">
            <Image
              className="dark-purple:invert absolute bottom-2 left-2 opacity-30 dark:invert"
              src="characters/cat.svg"
              alt="Anonymous user"
              width={50}
              height={50}
            />
          </div>
        </Card>
      </section>
    </PageContent>
  </>
);

export default Page;
