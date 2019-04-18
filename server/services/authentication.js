const { verify } = require('jsonwebtoken');
const keys = require('@server/config/keys');

function getUserId(context) {
  console.log(context.request);
  const Authorization = context.request.get('Authorization');
  if (Authorization) {
    const token = Authorization.replace('Bearer ', '');
    const verifiedToken = verify(token, keys.jwtSecret);
    return verifiedToken && verifiedToken.userId;
  }
  return false;
}

module.exports = {
  getUserId,
};
