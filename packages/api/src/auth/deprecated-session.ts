import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { compare, hash } from "bcryptjs";
import cookieSignature from "cookie-signature";

const COOKIE_SECRET = process.env.COOKIE_SECRET ?? "c-secret";

/**
 * Get the user ID from the deprecated session cookie
 * @deprecated
 */
export const getDeprecatedSession = async () => {
  const cookieStore = await cookies();
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
export const setDeprecatedSession = async (userId: string) => {
  const cookieStore = await cookies();

  if (!userId) {
    return null;
  }

  const sessionString = JSON.stringify({ user: userId });
  const base64Session = Buffer.from(sessionString).toString("base64");
  const signedCookie = cookieSignature.sign(base64Session, COOKIE_SECRET);

  cookieStore.set("__session", signedCookie);
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

export const validatePassword = async (
  password: string,
  passwordHash: string,
) => {
  const isMatchingPassword = await compare(password, passwordHash);
  return isMatchingPassword;
};

const generateToken = () => {
  return randomBytes(20).toString("hex");
};
