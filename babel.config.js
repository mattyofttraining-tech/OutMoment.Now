module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'react' }]],
    plugins: [
      // Reanimated 4 ships its Babel plugin via react-native-worklets.
      // This must be listed last.
      'react-native-worklets/plugin',
    ],
  };
};
