import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { outDir, targets } from './targets';

// Scans everything that ships, including bundled dependencies, which source lint can't see.

const sinks: [string, RegExp][] = [
  ['fetch()', /\bfetch\s*\(/],
  ['XMLHttpRequest', /\bXMLHttpRequest\b/],
  ['WebSocket', /\bWebSocket\b/],
  ['EventSource', /\bEventSource\b/],
  ['sendBeacon', /\bsendBeacon\b/],
  ['importScripts', /\bimportScripts\b/],
];
const dynamicCode: [string, RegExp][] = [
  ['eval()', /(?<![\w$.])eval\s*\(/],
  ['new Function()', /\bnew\s+Function\s*\(/],
  ['Function()', /(?<![\w$.])Function\s*\(\s*["'`]/],
];

/** URL literals that are identifiers, never fetched. Anything else needs a reason here. */
const allowedUrls = [
  /^http:\/\/www\.w3\.org\//, // XML namespaces (SVG, MathML, XLink) used by React DOM
  /^https:\/\/react\.dev\/errors\//, // production error decoder link in React's messages
];

function files(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.(js|mjs|html|css|json)$/.test(file))
    .map((file) => path.join(dir, file));
}

function findings(target: Parameters<typeof outDir>[0], patterns: [string, RegExp][]) {
  const dir = outDir(target);
  return files(dir).flatMap((file) => {
    const text = readFileSync(file, 'utf8');
    return patterns
      .filter(([, pattern]) => pattern.test(text))
      .map(([name]) => `${path.relative(dir, file)}: ${name}`);
  });
}

describe.each(targets())('%s built output', (target) => {
  describe('REQ-PRIV-005 contains no network sinks or remote URLs', () => {
    it('has no fetch, XHR, WebSocket, EventSource, beacon or importScripts', () => {
      expect(findings(target, sinks)).toEqual([]);
    });

    it('has no URL literals outside the allowlist', () => {
      const dir = outDir(target);
      const urls = files(dir).flatMap((file) =>
        [...readFileSync(file, 'utf8').matchAll(/https?:\/\/[^\s"'`)<>\\]+/g)].map((m) => m[0]),
      );
      expect(urls.filter((url) => !allowedUrls.some((allowed) => allowed.test(url)))).toEqual([]);
    });
  });

  describe('REQ-NFR-005 contains no dynamic code', () => {
    it('has no eval or Function constructor', () => {
      expect(findings(target, dynamicCode)).toEqual([]);
    });
  });
});
