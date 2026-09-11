module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        '@babel/preset-react',
        {
          runtime: 'automatic',
        },
      ],
      ['@babel/preset-typescript'],
    ],
    plugins: [],
    env: {
      test: {
        presets: [
          ['module:@react-native/babel-preset', { useTransformReactJSX: true }],
        ],
      },
    },
  };
};
