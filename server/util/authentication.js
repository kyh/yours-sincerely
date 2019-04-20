const { verify } = require('jsonwebtoken');
const keys = require('@server/config/keys');

/**
 * Given a request instance, return back the token from either `Authorization`
 * header or `token` Cookie.
 * @param {Request} request
 */
function parseRequest(request) {
  const { authorization } = request.headers;
  if (authorization) {
    return authorization && authorization.split(' ')[1];
  }
  return request.cookies.token;
}

function getUser(token) {
  if (token) {
    const user = verify(token, keys.auth.jwtSecret);
    return user;
  }
  return null;
}

module.exports = {
  parseRequest,
  getUser,
};
