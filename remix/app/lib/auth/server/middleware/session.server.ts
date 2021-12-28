import { createCookieSessionStorage } from "remix";
import { cookieOptions } from "~/lib/auth/server/authConfig";

export const sessionStorage = createCookieSessionStorage({
  cookie: cookieOptions,
});

export const { getSession, commitSession, destroySession } = sessionStorage;
