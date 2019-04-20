const { verify } = require('jsonwebtoken');
const keys = require('@server/config/keys');

function getUser(authorization) {
  const token = authorization && authorization.split(' ')[1];
  if (token) {
    const user = verify(token, keys.auth.jwtSecret);
    return user;
  }
  return null;
}

module.exports = {
  getUser,
};
