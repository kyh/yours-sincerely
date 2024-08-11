import { cookies } from "next/headers";
import cookieSignature from "cookie-signature";

const COOKIE_SECRET = process.env.COOKIE_SECRET ?? "c-secret";

/**
 * Get the user ID from the deprecated session cookie
 * @deprecated
 */
export const getDeprecatedSession = () => {
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

/**
 * Set the user ID from the deprecated session cookie
 * @deprecated
 */
export const setDeprecatedSession = (value: string) => {
  const cookieStore = cookies();

  if (!value) {
    return null;
  }

  const sessionString = JSON.stringify({ user: value });
  const base64Session = Buffer.from(sessionString).toString("base64");
  const signedCookie = cookieSignature.sign(base64Session, COOKIE_SECRET);

  cookieStore.set("__session", signedCookie);
};
