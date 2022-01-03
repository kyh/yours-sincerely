import { Authenticator } from "remix-auth";
import {
  sessionStorage,
  getSession,
  commitSession,
} from "~/lib/auth/server/middleware/session.server";
import { User } from "~/lib/user/data/userSchema";
import { getUser } from "~/lib/user/server/userService.server";
import {
  signupStrategy,
  loginStrategy,
} from "~/lib/auth/server/strategy/form.server";
import { googleStrategy } from "~/lib/auth/server/strategy/google.server";

const authenticator = new Authenticator<User["id"]>(sessionStorage);

authenticator.use(signupStrategy, "signup");
authenticator.use(loginStrategy, "login");
authenticator.use(googleStrategy, "google");

export const { sessionKey, authenticate } = authenticator;

export const isAuthenticated = async (request: Request) => {
  const userId = await authenticator.isAuthenticated(request);
  if (!userId) return null;
  return getUser({ id: userId });
};

export const attachUserSession = async (request: Request, id: User["id"]) => {
  const session = await getSession(request);
  session.set(sessionKey, id);
  const headers = new Headers({ "Set-Cookie": await commitSession(session) });
  return headers;
};
