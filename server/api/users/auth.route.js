const passport = require('passport');

module.exports = (server) => {
  server.get(
    '/auth/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
    }),
  );

  server.get(
    '/auth/google/callback',
    passport.authenticate('google'),
    (req, res) => {
      res.redirect('/');
    },
  );

  server.get('/auth/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

  server.get('/api/current_user', (req, res) => {
    res.sendSuccess(req.user);
  });
};
