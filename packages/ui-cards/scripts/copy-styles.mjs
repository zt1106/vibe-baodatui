import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(scriptDir, '..');
const source = resolve(packageDir, 'src/styles');
const target = resolve(packageDir, 'dist/styles');

if (!existsSync(source)) {
  console.warn(`[ui-cards] No styles directory at ${source}, skipping copy.`);
  process.exit(0);
}

mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
console.info(`[ui-cards] Copied card styles to ${target}`);
