import { LoaderFunction } from "remix";
import { authenticate } from "~/lib/auth/server/middleware/auth.server";

export const loader: LoaderFunction = ({ request }) => {
  return authenticate("google", request, {
    successRedirect: "/",
    failureRedirect: "/login",
  });
};
