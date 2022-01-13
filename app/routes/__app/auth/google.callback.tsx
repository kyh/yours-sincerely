import { LoaderFunction } from "remix";
import { authenticator } from "~/lib/auth/server/authenticator.server";

export const loader: LoaderFunction = async ({ request }) => {
  return authenticator.authenticate("google", request, {
    successRedirect: "/",
    failureRedirect: "/auth/login",
  });
};
