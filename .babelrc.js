const npmPackage = require('./package.json');

const presets = ['next/babel'];
const plugins = [
  ['module-resolver', { alias: npmPackage._moduleAliases }],
];

module.exports = { presets, plugins };
