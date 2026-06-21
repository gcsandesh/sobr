module.exports = function (api) {
  api.cache(true);
  return {
    // SDK 54 / Reanimated 4: babel-preset-expo injects the react-native-worklets
    // plugin automatically, so it must NOT be added manually here.
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
