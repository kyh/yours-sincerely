import { Authenticator, AuthorizationError } from "remix-auth";
import { User } from "~/lib/user/data/userSchema";
import { sessionStorage, getSession } from "~/lib/core/server/session.server";
import { getUser } from "~/lib/user/server/userService.server";
import {
  signupStrategy,
  loginStrategy,
} from "~/lib/auth/server/strategy/form.server";
import { googleStrategy } from "~/lib/auth/server/strategy/google.server";

export const authenticator = new Authenticator<User["id"]>(sessionStorage, {
  throwOnError: true,
});

authenticator.use(signupStrategy, "signup");
authenticator.use(loginStrategy, "login");
authenticator.use(googleStrategy, "google");

export const isAuthenticated = async (request: Request) => {
  const userId = await authenticator.isAuthenticated(request);
  if (!userId) return null;
  return getUser({ id: userId });
};

export const attachUserSession = async (request: Request, id: User["id"]) => {
  const session = await getSession(request);
  session.set(authenticator.sessionKey, id);
  const headers = new Headers({
    "Set-Cookie": await sessionStorage.commitSession(session),
  });
  return headers;
};

export { AuthorizationError };
