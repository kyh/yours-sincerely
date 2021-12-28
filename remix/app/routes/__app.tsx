import { Outlet, Link } from "remix";
import { Logo } from "~/lib/core/ui/Logo";

const Page = () => (
  <section className="page">
    <nav className="flex py-5 justify-between items-center text-slate-500 text-sm leading-4">
      <Link to="/">
        <Logo className="w-[7.5rem]" />
      </Link>
      <ul className="flex items-center gap-3">
        <li>
          <Link
            className="text-slate-500 hover:no-underline hover:text-slate-900"
            to="/profile"
          >
            Profile
          </Link>
        </li>
        <li>
          <Link
            className="inline-flex items-center px-3 py-2 border-2 border-primary shadow-sm rounded-md text-primary bg-white hover:bg-gray-50 hover:no-underline"
            to="/new"
          >
            New Post
          </Link>
        </li>
      </ul>
    </nav>
    <Outlet />
    <footer className="flex py-5 justify-between items-center text-slate-500 text-sm leading-4 mt-5">
      <span>©{new Date().getFullYear()}, Made with 💻</span>
      <ul className="flex items-center gap-3">
        <li>
          <Link className="text-slate-500" to="/about">
            About
          </Link>
        </li>
        <li>
          <a
            className="text-slate-500"
            href="https://github.com/kyh/yours-sincerely"
            target="_blank"
            rel="noopener noreferrer"
          >
            Github
          </a>
        </li>
      </ul>
    </footer>
  </section>
);

export default Page;
