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

export const signInWithOAuthInput = z.object({
  provider: z.enum(["github"]),
});
export type SignInWithOAuthInput = z.infer<typeof signInWithOAuthInput>;

export const requestPasswordResetInput = z.object({
  email: z.string().email(),
});
export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetInput
>;

export const updatePasswordInput = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type UpdatePasswordInput = z.infer<typeof updatePasswordInput>;
