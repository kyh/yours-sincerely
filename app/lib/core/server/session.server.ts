import { createCookieSessionStorage, Session } from "remix";

export const COOKIE_SECRET = process.env.COOKIE_SECRET || "c-secret";

const cookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as "lax",
  maxAge: 24 * 60 * 60 * 1000 * 30,
  secrets: [COOKIE_SECRET],
  secure: process.env.NODE_ENV !== "development" && !process.env.INSECURE_AUTH,
};

export const sessionStorage = createCookieSessionStorage({
  cookie: cookieOptions,
});

export const getSession = (request: Request): Promise<Session> => {
  return sessionStorage.getSession(request.headers.get("Cookie"));
};

const flashKey = "flashMessage";

export const flash = async (request: Request, message: string) => {
  const session = await getSession(request);
  session.flash(flashKey, message);
  const headers = new Headers({
    "Set-Cookie": await sessionStorage.commitSession(session),
  });

  return headers;
};

export const getFlash = async (request: Request) => {
  const session = await getSession(request);
  const message = session.get(flashKey) || null;

  return message;
};
