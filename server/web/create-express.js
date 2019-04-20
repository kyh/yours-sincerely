/**
 * Node http server built with Express.
 */
const express = require('express');

// Middlewares.
const avatarsMiddleware = require('adorable-avatars');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const authMiddleware = require('@server/middlewares/authentication');

function createExpress() {
  const app = express();

  app.use(helmet());
  app.use(cookieParser());
  app.use(authMiddleware);
  app.use('/avatars', avatarsMiddleware);

  return app;
}

module.exports = createExpress;
