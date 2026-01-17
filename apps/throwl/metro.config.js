const { withNxMetro } = require('@nx/react-native');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const {
  getResolveRequest,
} = require('@nx/react-native/plugins/metro-resolver');

const defaultConfig = getDefaultConfig(__dirname);

const customConfig = {
  cacheVersion: '@throwl/throwl',
  resolver: {
    // keep whatever Metro/Nx already had
    ...defaultConfig.resolver,
    // let Nx handle monorepo + TS/exports resolution
    resolveRequest: getResolveRequest(),
  },
};

module.exports = withNxMetro(mergeConfig(defaultConfig, customConfig), {
  debug: false,
  extensions: [],
  watchFolders: [],
});
