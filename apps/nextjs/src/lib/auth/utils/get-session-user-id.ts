import { cookies } from "next/headers";
import cookieSignature from "cookie-signature";

const COOKIE_SECRET = process.env.COOKIE_SECRET ?? "c-secret";

export const getSessionUserId = () => {
  const cookieStore = cookies();
  const sessionValue = cookieStore.get("__session")?.value;

  if (!sessionValue) {
    return null;
  }

  const unsignedCookie = cookieSignature.unsign(sessionValue, COOKIE_SECRET);
  if (!unsignedCookie) {
    return null;
  }

  try {
    const parsed = JSON.parse(atob(unsignedCookie)) as { user: string };
    return parsed.user;
  } catch (error) {
    return null;
  }
};
