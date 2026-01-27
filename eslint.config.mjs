import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      'jest.config.cts',
      '.babelrc.js',
      'metro.config.js',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          banTransitiveDependencies: false,

          depConstraints: [
            // ----------------------------
            // Apps
            // ----------------------------
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:feature', 'type:shared'],
            },

            // ----------------------------
            // Features
            // ----------------------------
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:shared',
                // (optional) allow depending on other features:
                // If you want ZERO feature->feature coupling, remove 'type:feature'
                // and instead create "feature-aggregate" or "shared" libs.
                'type:feature',
              ],
            },

            // Uncomment to enforce "feature-auth can't import feature-settings"
            // {
            //   sourceTag: 'type:feature',
            //   onlyDependOnLibsWithTags: ['type:shared', 'type:feature', 'scope:auth']
            // },

            // ----------------------------
            // Shared (general)
            // ----------------------------
            {
              sourceTag: 'type:shared',
              onlyDependOnLibsWithTags: ['type:shared'],
            },

            // ----------------------------
            // Shared domain (pure)
            // ----------------------------
            {
              sourceTag: 'type:shared-domain',
              onlyDependOnLibsWithTags: ['type:shared-domain'],
            },

            // ----------------------------
            // Shared UI (should not pull data-access)
            // ----------------------------
            {
              sourceTag: 'type:shared-ui',
              onlyDependOnLibsWithTags: [
                'type:shared',
                'type:shared-ui',
                'type:shared-domain',
              ],
            },

            // ----------------------------
            // Data access (allowed to use domain + shared utils, but not UI)
            // ----------------------------
            {
              sourceTag: 'scope:data-access',
              onlyDependOnLibsWithTags: [
                'type:shared',
                'type:shared-domain',
                'scope:data-access',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
