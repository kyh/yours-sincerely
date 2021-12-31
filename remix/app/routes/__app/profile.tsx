import { LoaderFunction, useLoaderData } from "remix";
import { authenticator } from "~/lib/auth/server/middleware/auth.server";
import { Session } from "~/lib/auth/data/authSchema";
import { Profile } from "~/lib/user/ui/Profile";
import { NoProfile } from "~/lib/user/ui/NoProfile";

type LoaderData = {
  user: Session["user"];
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);
  const data: LoaderData = {
    user,
  };

  return data;
};

const Page = () => {
  const { user } = useLoaderData<LoaderData>();
  return (
    <main className="pt-5">
      {!user && <NoProfile />}
      {!!user && <Profile />}
    </main>
  );
};

export default Page;
