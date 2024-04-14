import Link from "next/link";
import { Logo } from "./logo";

export const TopNav = ({ children }: { children?: React.ReactNode }) => {
  return (
    <nav className="flex items-center justify-between py-5 text-sm leading-4 text-slate-500 dark:text-slate-300">
      <Link href="/" title="home">
        <Logo className="w-[6rem]" />
      </Link>
      {children}
    </nav>
  );
};
