import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/production-web-pwa-smoke.yml', import.meta.url), 'utf8');
const expectedCache = workflow.match(/^\s*EXPECTED_PWA_CACHE:\s*(coco-en-forma-v[\w.-]+)\s*$/m)?.[1];

export function assertPwaRelease(serviceWorker) {
  assert.ok(expectedCache, 'The production smoke check must declare the expected PWA release');
  assert.equal(serviceWorker.match(/^const CACHE_VERSION="([^"]+)";$/m)?.[1], expectedCache);
}
