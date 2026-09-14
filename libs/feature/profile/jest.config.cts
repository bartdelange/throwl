const rootPreset = require('../../../jest.preset.js');
/// <reference types="jest" />
/// <reference types="node" />
module.exports = {
  displayName: '@throwl/feature-profile',
  preset: '@react-native/jest-preset',
  resolver: '@nx/jest/plugins/resolver',
  moduleFileExtensions: ['ts', 'js', 'html', 'tsx', 'jsx'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleNameMapper: {
    ...(rootPreset.moduleNameMapper || {}),
    '\\.svg$': '<rootDir>/../../../tools/jest/svg-mock.js',
  },
  transform: {
    '^.+\.(js|ts|tsx)$': [
      'babel-jest',
      {
        configFile: __dirname + '/.babelrc.js',
      },
    ],
    '^.+\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$': require.resolve(
      '@react-native/jest-preset/jest/assetFileTransformer.js',
    ),
  },
  coverageDirectory: '../../../coverage/libs/feature/settings',
  passWithNoTests: true,
};
