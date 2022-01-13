import { FormStrategy } from "remix-auth-form";
import validator from "validator";
import {
  getUser,
  createUser,
  getUserPasswordHash,
} from "~/lib/user/server/userService.server";
import { validatePassword } from "~/lib/auth/server/authService.server";

export const signupStrategy = new FormStrategy(async ({ form }) => {
  const email = form.get("email") as string;
  const password = form.get("password") as string;

  const existingUser = await getUser({ email });

  if (existingUser) throw new Error("User already exists");
  if (!validator.isEmail(email)) throw new Error("Invalid email");
  if (!validator.isLength(password, { min: 5 }))
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
