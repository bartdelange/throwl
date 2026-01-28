const rootPreset = require('../../jest.preset');

/// <reference types="jest" />
/// <reference types="node" />
module.exports = {
  displayName: '@throwl/throwl',
  preset: 'react-native',
  resolver: '@nx/jest/plugins/resolver',
  moduleFileExtensions: ['ts', 'js', 'html', 'tsx', 'jsx'],
  moduleNameMapper: rootPreset.moduleNameMapper,
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native' +
      '|@react-native' +
      '|@react-navigation' +
      '|react-native-gesture-handler' +
      '|react-native-reanimated' +
      '|react-native-screens' +
      '|react-native-safe-area-context' +
      ')/)',
  ],
  transform: {
    '^.+\.(js|ts|tsx)$': [
      'babel-jest',
      {
        configFile: __dirname + '/.babelrc.js',
      },
    ],
    '^.+\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$': require.resolve(
      'react-native/jest/assetFileTransformer.js',
    ),
  },
  coverageDirectory: '../../coverage/apps/throwl',
};
