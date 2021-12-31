import { Authenticator } from "remix-auth";
import { sessionStorage } from "~/lib/auth/server/middleware/session.server";
import { User } from "~/lib/user/data/userSchema";

import {
  signupStrategy,
  loginStrategy,
} from "~/lib/auth/server/strategy/form.server";
import { googleStrategy } from "~/lib/auth/server/strategy/google.server";

export let authenticator = new Authenticator<User>(sessionStorage);

authenticator.use(signupStrategy, "signup");
authenticator.use(loginStrategy, "login");
authenticator.use(googleStrategy, "google");
