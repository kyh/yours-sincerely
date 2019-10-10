/**
 * Node http server built with Express.
 */
const express = require('express');

// Middlewares.
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

function createExpress() {
  const app = express();

  app.use(helmet());
  app.use(cookieParser());

  return app;
}

module.exports = createExpress;
