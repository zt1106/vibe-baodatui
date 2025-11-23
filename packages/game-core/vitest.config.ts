import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const resolveFromRoot = (relativePath: string) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), relativePath);

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.mjs', '.jsx', '.json'],
    alias: {
      // Point to source to avoid stale built output in workspace dependencies.
      '@poker/core-cards': resolveFromRoot('../core-cards/src/index.ts'),
      '@core-cards': resolveFromRoot('../core-cards/src'),
    },
  },
});
