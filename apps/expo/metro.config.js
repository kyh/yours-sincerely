/* oxlint-disable unicorn/prefer-module -- as ESM this config would load nativewind/metro's ESM build, whose react-native-css dependency reads __dirname and throws; CommonJS loads its CJS build */
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const { FileStore } = require("metro-cache");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.cacheStores = [
  new FileStore({
    root: path.join(__dirname, "node_modules", ".cache", "metro"),
  }),
];

module.exports = withNativewind(config);
