const rootPreset = require('../../../../jest.preset.js');
/// <reference types="jest" />
/// <reference types="node" />
module.exports = {
  displayName: '@throwl/shared-data-access-firebase',
  preset: 'react-native',
  resolver: '@nx/jest/plugins/resolver',
  moduleFileExtensions: ['ts', 'js', 'html', 'tsx', 'jsx'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleNameMapper: {
    ...(rootPreset.moduleNameMapper || {}),
    '\\.svg$': '@nx/react-native/plugins/jest/svg-mock',
  },
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
  coverageDirectory: '../../../../coverage/libs/shared/data-access/firebase',
};
