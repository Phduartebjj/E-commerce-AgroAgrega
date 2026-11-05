import { copyFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const browserDir = resolve(import.meta.dirname, '..', 'dist', 'e-commerce-AgroAgrega', 'browser');
const csrIndex = resolve(browserDir, 'index.csr.html');
const standardIndex = resolve(browserDir, 'index.html');
const notFound = resolve(browserDir, '404.html');

try {
  await access(csrIndex);
  await copyFile(csrIndex, notFound);
  console.log('Created 404.html from index.csr.html');
} catch {
  await copyFile(standardIndex, notFound);
  console.log('Created 404.html from index.html');
}
