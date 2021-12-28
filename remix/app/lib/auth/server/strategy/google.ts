import { GoogleStrategy } from "remix-auth-google";
import { getAccount } from "~/lib/user/server/accountService";
import { createUser } from "~/lib/user/server/userService";

export const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID || "GOOGLE_CLIENT_ID",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "GOOGLE_CLIENT_SECRET",
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "GOOGLE_CALLBACK_URL",
  },
  async ({ accessToken, refreshToken, profile }) => {
    const account = await getAccount({
      provider: profile.provider,
      providerAccountId: profile.id,
    });

    if (account) return account.user;

    const user = await createUser({
      name: profile.displayName,
      email: profile.emails ? profile.emails[0].value : "",
      image: profile.photos ? profile.photos[0].value : "",
      account: {
        provider: profile.provider,
        providerAccountId: profile.id,
        accessToken,
        refreshToken,
      },
    });

    return user;
  }
);
