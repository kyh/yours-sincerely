const boom = require('boom');

function sendSuccess(data, message) {
  this.status(200).json({ type: 'success', data, message });
}

function sendError(boomError) {
  if (boomError.isServer) {
    console.log(boomError);
  }
  return this.status(boomError.output.statusCode).json(
    boomError.output.payload,
  );
}

module.exports = {
  responseMiddleware(req, res, next) {
    res.sendSuccess = sendSuccess;
    res.sendError = sendError;
    next();
  },
  catchErrorMiddleware(error, req, res, next) {
    if (error) {
      console.log('Uncaught error:', error);
      return res.sendError(boom.serverUnavailable('Uncaught error', error));
    }
    return next();
  },
};
