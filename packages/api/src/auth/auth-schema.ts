import { z } from "zod";

export const signUpInput = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type SignUpInput = z.infer<typeof signUpInput>;

export const signInWithPasswordInput = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type SignInWithPasswordInput = z.infer<typeof signInWithPasswordInput>;

export const requestPasswordResetInput = z.object({
  email: z.string().email(),
});
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetInput>;

export const setPasswordInput = z.object({
  token: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type SetPasswordInput = z.infer<typeof setPasswordInput>;

export const verifyResetTokenInput = z.object({
  token: z.string(),
});
export type VerifyResetTokenInput = z.infer<typeof verifyResetTokenInput>;

export const updatePasswordInput = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});
export type UpdatePasswordInput = z.infer<typeof updatePasswordInput>;
