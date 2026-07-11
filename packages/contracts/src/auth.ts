import { z } from "zod";

/** Wire contract between the API's Set-Cookie and the native cookie jar —
    renaming it server-side silently breaks the Expo app. */
export const SESSION_COOKIE_NAME = "__session";

export const signUpInput = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signInWithPasswordInput = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type SignInWithPasswordInput = z.infer<typeof signInWithPasswordInput>;

export const requestPasswordResetInput = z.object({ email: z.string().email() });

export const setPasswordInput = z.object({
  token: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
