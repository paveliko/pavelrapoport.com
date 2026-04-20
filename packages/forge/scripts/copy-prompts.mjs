#!/usr/bin/env node
import { cp, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'src');
const dist = join(root, 'dist');

const files = globSync('**/prompts/*.md', { cwd: src });

for (const file of files) {
  const from = join(src, file);
  const to = join(dist, file);
  await mkdir(dirname(to), { recursive: true });
  await cp(from, to);
}

console.log(`Copied ${files.length} prompt files from src/ to dist/`);
