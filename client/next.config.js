const webpack = require('webpack');
const withOffline = require('next-offline');

const nextConfig = {
  webpack(config) {
    config.plugins.push(new webpack.EnvironmentPlugin(['API_URL', 'APP_URL']));
    return config;
  },
};

module.exports = withOffline(nextConfig);
