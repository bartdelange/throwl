/** @type {import('react-native-worklets/plugin').PluginOptions} */
const workletsPluginOptions = {
  // Your custom options.
};
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['.'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '~': './src',
          '#': './src/constants',
        },
      },
    ],
    ['react-native-worklets/plugin', workletsPluginOptions],
  ],
};
