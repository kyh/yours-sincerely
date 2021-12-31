import { LoaderFunction } from "remix";
import { authenticator } from "~/lib/auth/server/middleware/auth.server";

export let loader: LoaderFunction = ({ request }) => {
  return authenticator.authenticate("google", request, {
    successRedirect: "/",
    failureRedirect: "/login",
  });
};
