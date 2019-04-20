/**
 * Next.js app which handles SSR of React application.
 */
const next = require('next');
const path = require('path');
const keys = require('@server/config/keys');

function createNext() {
  const app = next({
    dev: keys.nodeEnv !== 'production',
    dir: path.resolve('client'),
  });
  const handle = app.getRequestHandler();

  return { nextApp: app, handle };
}

module.exports = createNext;
