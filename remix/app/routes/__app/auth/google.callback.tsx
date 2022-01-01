import { LoaderFunction } from "remix";
import { authenticator } from "~/lib/auth/server/middleware/auth.server";

export const loader: LoaderFunction = ({ request }) => {
  return authenticator.authenticate("google", request, {
    successRedirect: "/",
    failureRedirect: "/login",
  });
};
