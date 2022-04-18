import { Session } from "@remix-run/node";
import { Authenticator, AuthorizationError } from "remix-auth";
import { User } from "~/lib/user/data/userSchema";
import {
  sessionStorage,
  getSession,
  commitSession,
} from "~/lib/core/server/session.server";
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

export const setUserSession = async (session: Session, id: User["id"]) => {
  session.set(authenticator.sessionKey, id);

  return session;
};

export const setUserSessionAndCommit = async (
  request: Request,
  id: User["id"]
) => {
  const session = await getSession(request);
  await setUserSession(session, id);
  const headers = await commitSession(session);

  return headers;
};

export { AuthorizationError };
