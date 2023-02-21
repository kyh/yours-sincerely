import { FormStrategy } from "remix-auth-form";
import { isEmailValid, isPasswordValid } from "~/lib/auth/data/authSchema";
import { validatePassword } from "~/lib/auth/server/authService.server";
import {
  createUser,
  getUser,
  getUserPasswordHash,
} from "~/lib/user/server/userService.server";

export const signupStrategy = new FormStrategy(async ({ form }) => {
  const email = form.get("email") as string;
  const password = form.get("password") as string;

  const existingUser = await getUser({ email });

  if (existingUser) throw new Error("User already exists");
  if (!isEmailValid(email)) throw new Error("Invalid email");
  if (!isPasswordValid(password))
    throw new Error("Password must be at least 5 characters");

  const user = await createUser({ email, password });

  return user.id;
});

export const loginStrategy = new FormStrategy(async ({ form }) => {
  const email = form.get("email") as string;
  const password = form.get("password") as string;

  const { user, passwordHash } = await getUserPasswordHash({ email });

  if (
    !user ||
    !passwordHash ||
    (passwordHash && !(await validatePassword(password, passwordHash)))
  ) {
    throw new Error("Invalid credentials");
  }

  return user.id;
});
