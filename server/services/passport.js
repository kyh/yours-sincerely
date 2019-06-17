const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const keys = require('@server/config/keys');
const prisma = require('@server/services/db');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await prisma.query.user({ where: { id } });
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      callbackURL: '/auth/google/callback',
      clientID: keys.googleClientID,
      clientSecret: keys.googleClientSecret,
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await prisma.query.user({
          where: { googleId: profile.id },
        });

        if (existingUser) {
          return done(null, existingUser);
        }

        const user = await prisma.mutation.createUser({
          data: {
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile.emails[0],
            profileImageUrl: profile.photos[0] && profile.photos[0].value,
          },
        });

        return done(null, user);
      } catch (err) {
        done(err);
      }
    },
  ),
);
