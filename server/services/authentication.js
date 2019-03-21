const { verify } = require('jsonwebtoken');
const keys = require('@server/config/keys');

function getUserId(context) {
  const Authorization = context.request.get('Authorization');
  if (Authorization) {
    const token = Authorization.replace('Bearer ', '');
    const verifiedToken = verify(token, keys.jwtSecret);
    return verifiedToken && verifiedToken.userId;
  }
}

module.exports = {
  getUserId,
};
