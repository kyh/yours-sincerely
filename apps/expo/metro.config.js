// Learn more: https://docs.expo.dev/guides/monorepos/
const path = require("node:path");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const { FileStore } = require("metro-cache");
const { withNativewind } = require("nativewind/metro");

const config = getSentryExpoConfig(__dirname);

config.cacheStores = [
  new FileStore({
    root: path.join(__dirname, "node_modules", ".cache", "metro"),
  }),
];

/** @type {import('expo/metro-config').MetroConfig} */
module.exports = withNativewind(config);
