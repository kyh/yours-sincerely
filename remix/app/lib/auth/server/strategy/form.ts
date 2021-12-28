import { FormStrategy } from "remix-auth-form";
import { createUser, getUserPasswordHash } from "~/lib/user/server/userService";
import { validatePassword } from "~/lib/auth/server/authService";

export const signupStrategy = new FormStrategy(async ({ form }) => {
  const email = form.get("email") as string;
  const password = form.get("password") as string;

  const user = await createUser({ email, password });

  return user;
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

  return user;
});
