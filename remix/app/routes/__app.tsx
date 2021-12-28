import { Outlet } from "remix";

const Page = () => (
  <>
    <nav>This should always show up</nav>
    <Outlet />
  </>
);

export default Page;
