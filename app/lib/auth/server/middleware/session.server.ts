import { createCookieSessionStorage, Session } from "remix";
import { cookieOptions } from "~/lib/auth/server/authConfig";

export const sessionStorage = createCookieSessionStorage({
  cookie: cookieOptions,
});

export const getSession = (request: Request): Promise<Session> => {
  return sessionStorage.getSession(request.headers.get("Cookie"));
};

export let { commitSession, destroySession } = sessionStorage;
