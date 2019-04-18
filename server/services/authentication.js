const { verify } = require('jsonwebtoken');
const keys = require('@server/config/keys');

function getUserId(context) {
  const { cookies } = context.request;
  const token = cookies[keys.cookieName];
  if (token) {
    const verifiedToken = verify(token, keys.jwtSecret);
    return verifiedToken && verifiedToken.userId;
  }
  return false;
}

module.exports = {
  getUserId,
};
