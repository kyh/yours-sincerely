import { createCookieSessionStorage, Session } from "@remix-run/node";

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

export const getSession = async (request: Request) => {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  return session;
};

export const commitSession = async (session: Session) => {
  const headers = new Headers({
    "Set-Cookie": await sessionStorage.commitSession(session),
  });

  return headers;
};

type Flash = {
  type?: "default" | "success" | "error";
  message?: string;
};

const flashKey = "flashMessage";

export const flash = async (
  session: Session,
  message: string,
  type: Flash["type"] = "default"
) => {
  session.flash(flashKey, JSON.stringify({ type, message }));

  return session;
};

export const flashAndCommit = async (
  request: Request,
  message: string,
  type: Flash["type"] = "default"
) => {
  const session = await getSession(request);
  await flash(session, message, type);
  const headers = await commitSession(session);
  return headers;
};

export const getFlash = async (request: Request) => {
  const session = await getSession(request);
  const flash: Flash = JSON.parse(session.get(flashKey) || "{}");
  const headers = await commitSession(session);

  return { ...flash, headers };
};
