import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication forms built using the components.",
};

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="container relative flex-col items-center justify-center lg:max-w-none lg:px-0">
    {/* <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
      <div className="absolute inset-0 bg-zinc-900" />
      <Link
        className="relative z-20 flex items-center text-lg font-medium"
        href="/"
      >
        Acme Inc
      </Link>
      <div className="relative z-20 mt-auto">
        <blockquote className="space-y-2">
          <p className="text-lg">
            &ldquo;Aenean consectetur a enim ac posuere. Pellentesque vehicula
            semper blandit. Aliquam maximus ligula quis risus porta, sit amet
            pulvinar mi elementum. Lorem ipsum dolor sit amet, consectetur
            adipiscing elit.&rdquo;
          </p>
          <footer className="text-sm">Lorem Ipsum</footer>
        </blockquote>
      </div>
    </div> */}
    {/* <div className="lg:p-8">{children}</div> */}
    {children}
  </div>
);

export default Layout;
