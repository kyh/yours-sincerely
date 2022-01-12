import { createCookieSessionStorage, Session } from "remix";
import { Authenticator } from "remix-auth";
import { cookieOptions } from "~/lib/auth/server/authConfig";
import { User } from "~/lib/user/data/userSchema";
import { getUser } from "~/lib/user/server/userService.server";
import {
  signupStrategy,
  loginStrategy,
} from "~/lib/auth/server/strategy/form.server";
import { googleStrategy } from "~/lib/auth/server/strategy/google.server";

export const sessionStorage = createCookieSessionStorage({
  cookie: cookieOptions,
});

export const getSession = (request: Request): Promise<Session> => {
  return sessionStorage.getSession(request.headers.get("Cookie"));
};

export const authenticator = new Authenticator<User["id"]>(sessionStorage);

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
