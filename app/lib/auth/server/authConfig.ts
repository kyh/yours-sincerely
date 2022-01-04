export const COOKIE_SECRET = process.env.COOKIE_SECRET || "c-secret";

export const cookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as "lax",
  maxAge: 24 * 60 * 60 * 1000 * 30,
  secrets: [COOKIE_SECRET],
  secure: process.env.NODE_ENV !== "development" && !process.env.INSECURE_AUTH,
};
