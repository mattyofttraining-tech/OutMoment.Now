// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase v11 ships some packages as ESM with the `.cjs` extension that Metro
// does not resolve by default. Adding it keeps `firebase/auth` working under
// the New Architecture / Hermes.
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
