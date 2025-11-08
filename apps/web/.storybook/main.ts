import path from 'node:path';

import type { StorybookConfig } from '@storybook/react-webpack5';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

const config: StorybookConfig = {
  stories: ['../components/**/*.mdx', '../components/**/*.stories.@(ts|tsx)'],
  staticDirs: ['../public'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
    '@storybook/addon-themes'
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {}
  },
  docs: {
    autodocs: 'tag'
  },
  webpackFinal: async config => {
    config.resolve = config.resolve ?? {};
    config.resolve.extensions = Array.from(new Set([...(config.resolve.extensions ?? []), '.ts', '.tsx']));
    config.resolve.plugins = [
      ...(config.resolve.plugins ?? []),
      new TsconfigPathsPlugin({
        configFile: path.resolve(__dirname, '../tsconfig.json')
      })
    ];
    config.module = config.module ?? { rules: [] };
    config.module.rules = [
      ...(config.module.rules ?? []),
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve('ts-loader'),
            options: {
              transpileOnly: true,
              configFile: path.resolve(__dirname, '../tsconfig.json'),
              compilerOptions: {
                jsx: 'react-jsx'
              }
            }
          }
        ]
      }
    ];
    return config;
  }
};

export default config;
