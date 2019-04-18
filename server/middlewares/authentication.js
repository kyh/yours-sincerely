const { verify } = require('jsonwebtoken');
const keys = require('@server/config/keys');

function authMiddleware(request, response, next) {
  const { cookies } = request;
  const token = cookies[keys.cookieName];
  if (token) {
    const { userId } = verify(token, keys.jwtSecret);
    request.userId = userId;
  }
  next();
}

module.exports = authMiddleware;
