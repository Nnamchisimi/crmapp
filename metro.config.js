const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

/**
 * ✅ Correct fix for framer-motion + moti + tslib
 * DO NOT block tslib
 */
config.resolver.extraNodeModules = {
  tslib: require.resolve("tslib"),
};

// Ensure Metro supports ESM
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  "mjs",
];

module.exports = config;
