import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('@repo/forge').ForgeConfig} */
const config = {
  projectContextPath: resolve(__dirname, './FORGE.md'),
  issuePrefix: 'AI',
};

export default config;
