import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { compare, hash } from "bcryptjs";
import cookieSignature from "cookie-signature";

const COOKIE_SECRET = process.env.COOKIE_SECRET ?? "c-secret";
const SESSION_COOKIE_NAME = "__session";

/**
 * Get the user ID from the session cookie
 */
export const getSession = async () => {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

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
  } catch {
    return null;
  }
};

/**
 * Set the user ID in the session cookie
 */
export const setSession = async (userId: string) => {
  const cookieStore = await cookies();

  if (!userId) {
    return null;
  }

  const sessionString = JSON.stringify({ user: userId });
  const base64Session = Buffer.from(sessionString).toString("base64");
  const signedCookie = cookieSignature.sign(base64Session, COOKIE_SECRET);

  cookieStore.set(SESSION_COOKIE_NAME, signedCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
};

/**
 * Clear the session cookie
 */
export const clearSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  // Clear any lingering Supabase auth cookies (migration period)
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      cookieStore.delete(cookie.name);
    }
  }
};

export const createTempPassword = async () => {
  const tempPassword = generateToken();
  return await createPasswordHash(tempPassword);
};

const SALT_ROUNDS = 10;

export const createPasswordHash = async (password: string) => {
  const passwordHash = await hash(password, SALT_ROUNDS);
  return passwordHash;
};

export const validatePassword = async (password: string, passwordHash: string) => {
  const isMatchingPassword = await compare(password, passwordHash);
  return isMatchingPassword;
};

const generateToken = () => {
  return randomBytes(20).toString("hex");
};
