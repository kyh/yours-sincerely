const path = require('path');
const WorkboxPlugin = require('workbox-webpack-plugin');

/* eslint-disable */
module.exports = {
  webpack: (config, { dev }) => {
    /**
     * Install and Update our Service worker
     * on our main entry file :)
     * Reason: https://github.com/ooade/NextSimpleStarter/issues/32
     */
    const oldEntry = config.entry;

    config.entry = () =>
      oldEntry().then((entry) => {
        if (entry['main.js']) {
          entry['main.js'].push(path.resolve(__dirname, 'utils/offline'));
        }

        return entry;
      });

    /* Enable only in Production */
    if (!dev) {
      // Service Worker
      config.plugins.push(
        new WorkboxPlugin.InjectManifest({
          swSrc: path.join(__dirname, 'utils', 'sw.js'),
          swDest: path.join(__dirname, '.next', 'sw.js'),
          globDirectory: __dirname,
          globPatterns: [
            'static/**/*.{png,jpg,ico}', // Precache all static assets by default
          ],
        }),
      );
    }

    return config;
  },
};
