const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { ResolverFactory, CachedInputFileSystem } = require('enhanced-resolve');
const path = require('node:path');
const { loadConfig, createMatchPath } = require('tsconfig-paths');

const defaultConfig = getDefaultConfig(__dirname);
const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

const extensions = [
  '',
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  ...defaultConfig.resolver.sourceExts,
  ...defaultConfig.resolver.assetExts,
];

const uniqueExtensions = [...new Set(extensions)].filter(Boolean);
const metroResolver = require('metro-resolver');

const tsConfigResult = loadConfig(workspaceRoot);
const matchTsPath =
  tsConfigResult.resultType === 'success'
    ? createMatchPath(tsConfigResult.absoluteBaseUrl, tsConfigResult.paths)
    : null;

const pnpmResolver = ResolverFactory.createResolver({
  fileSystem: new CachedInputFileSystem(fs, 4000),
  extensions: uniqueExtensions.map((extension) => `.${extension}`),
  useSyncFileSystemCalls: true,
  modules: [path.join(workspaceRoot, 'node_modules'), 'node_modules'],
  conditionNames: [
    'native',
    'browser',
    'require',
    'default',
    'react-native',
    'node',
  ],
  mainFields: ['react-native', 'browser', 'main'],
  aliasFields: ['browser'],
});

function resolveFromPnpm(context, moduleName) {
  const lookupStartPath = path.dirname(context.originModulePath);
  const filePath = pnpmResolver.resolveSync({}, lookupStartPath, moduleName);

  return filePath ? { type: 'sourceFile', filePath } : null;
}

function resolveRequest(context, realModuleName, platform) {
  const { resolveRequest: contextResolveRequest, ...metroContext } = context;

  if (contextResolveRequest) {
    try {
      return contextResolveRequest(metroContext, realModuleName, platform);
    } catch {}
  }

  try {
    return metroResolver.resolve(metroContext, realModuleName, platform);
  } catch {}

  if (matchTsPath) {
    try {
      const mappedPath = matchTsPath(
        realModuleName,
        undefined,
        undefined,
        uniqueExtensions.map((extension) => `.${extension}`),
      );
      if (mappedPath) {
        return metroResolver.resolve(metroContext, mappedPath, platform);
      }
    } catch {}
  }

  return resolveFromPnpm(metroContext, realModuleName);
}

const customConfig = {
  cacheVersion: '@throwl/throwl',
  resolver: {
    ...defaultConfig.resolver,
    resolveRequest,
    nodeModulesPaths: [path.join(workspaceRoot, 'node_modules')],
  },
  watchFolders: [workspaceRoot],
  projectRoot,
};

module.exports = mergeConfig(defaultConfig, customConfig);
