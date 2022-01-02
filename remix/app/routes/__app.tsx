import { Outlet, Link, useMatches } from "remix";
import { Toaster } from "react-hot-toast";
import { Theme, ThemeProvider, useTheme } from "~/lib/core/ui/Theme";
import { Logo } from "~/lib/core/ui/Logo";

const Page = () => {
  const matches = useMatches();
  const childRoute = matches.at(-1);
  const isNewPage = childRoute && childRoute.pathname === "/posts/new";

  return (
    <ThemeProvider>
      <section
        className={`page ${isNewPage ? "bg-white dark:bg-slate-800" : ""}`}
      >
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "rgb(15 23 42)",
              color: "rgb(248 250 252)",
            },
          }}
        />
        <Nav isNewPage={isNewPage} />
        <Outlet />
        <Footer isNewPage={isNewPage} />
      </section>
    </ThemeProvider>
  );
};

const Nav = ({ isNewPage }: { isNewPage?: boolean }) => {
  return (
    <nav className="flex py-5 justify-between items-center text-slate-500 text-sm leading-4 dark:text-slate-300">
      <Link to="/">
        <Logo className="w-[7.5rem]" />
      </Link>
      {!isNewPage && (
        <ul className="flex items-center gap-3">
          <li>
            <Link
              className="text-slate-500 dark:text-slate-300 hover:no-underline hover:text-slate-900 dark:hover:text-slate-100"
              to="/profile"
            >
              Profile
            </Link>
          </li>
          <li>
            <Link
              className="inline-flex items-center px-3 py-2 border-2 border-primary shadow-primary-sm rounded-md transition text-primary bg-white dark:bg-slate-800 hover:text-primary-dark hover:bg-primary-bg hover:no-underline dark:hover:text-primary-light dark:hover:border-primary-light"
              to="/posts/new"
            >
              New Post
            </Link>
          </li>
        </ul>
      )}
    </nav>
  );
};

const Footer = ({ isNewPage }: { isNewPage?: boolean }) => {
  const { theme, setTheme } = useTheme();

  if (isNewPage) return null;

  const onThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(event.target.value as Theme);
  };

  return (
    <footer className="flex py-5 justify-between items-center text-slate-500 text-sm leading-4 mt-5 dark:text-slate-100">
      <span>©{new Date().getFullYear()}, Made with 💻</span>
      <ul className="flex items-center gap-3">
        <li>
          <Link className="text-slate-500 dark:text-slate-100" to="/about">
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
            className="py-1 px-2 text-xs rounded border-slate-500 bg-none text-center bg-transparent focus:border-primary-dark dark:border-slate-100 dark:focus:border-primary-light"
            value={theme}
            onChange={onThemeChange}
          >
            <option value="default">Default</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </li>
      </ul>
    </footer>
  );
};

export default Page;
