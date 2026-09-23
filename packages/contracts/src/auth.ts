import { z } from "zod";

/** Wire contract between the API's Set-Cookie and the native cookie jar —
    renaming it server-side silently breaks the Expo app. */
export const SESSION_COOKIE_NAME = "__session";

/** 400 days: the longest cookie lifetime browsers honor. A longer maxAge is
    silently clamped to it. */
export const BROWSER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

/** bcrypt hashes only the first 72 bytes and ignores the rest without error. */
const BCRYPT_MAX_PASSWORD_BYTES = 72;

/** Only for a password being chosen. Sign-in stays permissive so an account
    created before a rule existed can still log in. */
const newPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine(
    (password) => new TextEncoder().encode(password).length <= BCRYPT_MAX_PASSWORD_BYTES,
    "Password is too long",
  );

export const signUpInput = z.object({
  email: z.email(),
  password: newPassword,
});

export const signInWithPasswordInput = z.object({
  email: z.email(),
  password: z.string(),
});
export type SignInWithPasswordInput = z.infer<typeof signInWithPasswordInput>;

export const requestPasswordResetInput = z.object({ email: z.email() });

export const setPasswordInput = z.object({
  password: newPassword,
  token: z.string(),
});

/** The set-password screen's fields. The token is not typed by the user, so
    it is added when building the `setPasswordInput` payload. */
export const setPasswordFormInput = z
  .object({
    confirmPassword: z.string(),
    password: newPassword,
  })
  .refine((form) => form.password === form.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
