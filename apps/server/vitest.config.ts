import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const resolveFromRoot = (relativePath: string) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), relativePath);

export default defineConfig({
  resolve: {
    alias: {
      // Use source files for shared workspace imports in tests.
      '@shared': resolveFromRoot('../../packages/shared/src'),
    },
  },
});
