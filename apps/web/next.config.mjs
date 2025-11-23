import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isCoverage = process.env.ISTANBUL_COVERAGE === '1';
const clientSources = ['app', 'components', 'hooks', 'lib'].map((segment) =>
  path.join(__dirname, segment)
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isCoverage && !isServer) {
      config.module.rules.push({
        test: /\.[jt]sx?$/,
        include: clientSources,
        exclude: /node_modules/,
        use: {
          loader: 'istanbul-instrumenter-loader',
          options: { esModules: true },
        },
        enforce: 'post',
      });
      config.devtool = config.devtool ?? 'inline-source-map';
    }
    return config;
  }
};

export default nextConfig;
