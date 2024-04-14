"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@init/ui/theme";

import type { Theme } from "@/lib/core/util/theme";
import { themes } from "@/lib/core/util/theme";
import { useToast } from "../toaster";

export const Footer = () => {
  const currentPath = usePathname();
  const { theme, setTheme } = useTheme();
  // const { toast } = useToast();
  // const { message } = useOutletContext<{ message: string }>();

  // useEffect(() => {
  //   if (message) toast(message);
  // }, [message]);

  const onThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const updated =
      event.target.value === "default" ? null : event.target.value;
    setTheme(updated as Theme);
  };

  return (
    currentPath !== "/posts/new" && (
      <footer className="flex items-end justify-between py-5 text-sm leading-4 text-slate-500 dark:text-slate-100">
        <span>©{new Date().getFullYear()}, Made with 💻</span>
        <ul className="flex items-center gap-3">
          <li>
            <Link className="text-slate-500 dark:text-slate-100" href="/about">
              About
            </Link>
          </li>
          <li>
            <a
              className="text-slate-500 dark:text-slate-100"
              href="https://github.com/kyh/yours-sincerely"
              target="_blank"
              rel="noopener noreferrer"
            >
              Github
            </a>
          </li>
          <li>
            <select
              className="focus:border-primary-dark dark:focus:border-primary-light rounded border-slate-500 bg-transparent bg-none px-2 py-1 text-center text-xs capitalize dark:border-slate-100"
              value={theme ? theme : "default"}
              onChange={onThemeChange}
            >
              {themes.map((theme) => (
                <option value={theme} key={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </li>
        </ul>
      </footer>
    )
  );
};
