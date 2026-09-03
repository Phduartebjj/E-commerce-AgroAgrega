import { cp, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const angularOutput = resolve(projectRoot, 'dist', 'e-commerce-AgroAgrega', 'browser');
const sitesClientOutput = resolve(projectRoot, 'dist', 'client');
const sitesServerOutput = resolve(projectRoot, 'dist', 'server');

await mkdir(sitesClientOutput, { recursive: true });
await mkdir(sitesServerOutput, { recursive: true });
await cp(angularOutput, sitesClientOutput, { recursive: true, force: true });

const workerSource = `
async function fetchAsset(request, env) {
  const directResponse = await env.ASSETS.fetch(request);

  if (directResponse.status !== 404) return directResponse;

  const url = new URL(request.url);
  const cleanPath = url.pathname.replace(/\\/$/, '');

  if (!url.pathname.includes('.')) {
    url.pathname = cleanPath + '/index.html';
    const routeResponse = await env.ASSETS.fetch(new Request(url, request));

    if (routeResponse.status !== 404) return routeResponse;
  }

  url.pathname = '/index.html';
  return env.ASSETS.fetch(new Request(url, request));
}

export default {
  async fetch(request, env) {
    return fetchAsset(request, env);
  },
};
`.trimStart();

await writeFile(resolve(sitesServerOutput, 'index.js'), workerSource, 'utf8');
