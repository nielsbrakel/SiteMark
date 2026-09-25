import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Runs the real Biome config (biome.json + tools/biome plugins) on small fixture files placed at
// the paths whose rules they exercise, so a config change that silently drops a guard fails here.

type Case = { file: string; code: string; rule: string | null };

const long = (lines: number) => Array.from({ length: lines }, (_, i) => `  a += ${i};`).join('\n');
const nested = `export function f(a: number[], b: boolean, c: boolean) {
  let n = 0;
  for (const x of a) {
    if (b) {
      for (const y of a) {
        if (c && x > y) {
          while (n < 10) {
            if (x === 1 || y === 2) {
              n += x > 0 ? 1 : 2;
            } else if (n > 3) {
              n -= 1;
            } else {
              break;
            }
          }
        }
      }
    }
  }
  return n;
}
`;

const layers: Case[] = [
  { file: 'src/core/l1.ts', code: "export { a } from '@/app/ports';", rule: 'noRestrictedImports' },
  {
    file: 'src/core/l2.ts',
    code: "export { a } from '../platform/x';",
    rule: 'noRestrictedImports',
  },
  {
    file: 'src/core/l3.ts',
    code: "export { browser } from 'wxt/browser';",
    rule: 'noRestrictedImports',
  },
  {
    file: 'src/core/l4.ts',
    code: "export { useState } from 'react';",
    rule: 'noRestrictedImports',
  },
  {
    file: 'src/core/l5.ts',
    code: "export { t } from '@/lib/i18n/browser-source';",
    rule: 'noRestrictedImports',
  },
  {
    file: 'src/app/l1.ts',
    code: "export { a } from '@/platform/state-repo';",
    rule: 'noRestrictedImports',
  },
  {
    file: 'src/app/l2.ts',
    code: "export { browser } from 'wxt/browser';",
    rule: 'noRestrictedImports',
  },
  {
    file: 'src/content/l1.ts',
    code: "export { B } from '@/ui/components/button';",
    rule: 'noRestrictedImports',
  },
  {
    file: 'src/content/l2.ts',
    code: "export { useState } from 'react';",
    rule: 'noRestrictedImports',
  },
  {
    file: 'src/ui/l1.ts',
    code: "export { host } from '@/content/marker/host';",
    rule: 'noRestrictedImports',
  },
  {
    file: 'src/shared/l1.ts',
    code: "export { a } from '@/platform/tabs';",
    rule: 'noRestrictedImports',
  },
  {
    file: 'src/platform/l1.ts',
    code: "export { a } from '@/content/marker/host';",
    rule: 'noRestrictedImports',
  },
  {
    file: 'src/lib/i18n/translate.ts',
    code: "export { browser } from 'wxt/browser';",
    rule: 'noRestrictedImports',
  },
  {
    file: 'src/ui/l2.ts',
    code: "export { a } from '@/entrypoints/popup/App';",
    rule: 'noRestrictedImports',
  },
  // Allowed directions stay clean.
  { file: 'src/app/ok.ts', code: "export { ok } from '@/core/result';", rule: null },
  { file: 'src/platform/ok.ts', code: "export { ok } from '@/app/ports';", rule: null },
  {
    file: 'src/content/ok.ts',
    code: "export { v } from '@/shared/marker-view/banner';",
    rule: null,
  },
  { file: 'src/ui/ok.ts', code: "export { v } from '@/shared/marker-view/banner';", rule: null },
  { file: 'src/core/ok.ts', code: "export { ok } from './result';", rule: null },
];

const privacy: Case[] = [
  { file: 'src/app/p1.ts', code: "export const r = fetch('/x');", rule: 'noRestrictedGlobals' },
  {
    file: 'src/app/p2.ts',
    code: 'export const r = new XMLHttpRequest();',
    rule: 'noRestrictedGlobals',
  },
  {
    file: 'src/app/p3.ts',
    code: "export const r = new WebSocket('wss://x');",
    rule: 'noRestrictedGlobals',
  },
  {
    file: 'src/app/p4.ts',
    code: "export const r = new EventSource('/x');",
    rule: 'noRestrictedGlobals',
  },
  {
    file: 'src/app/p5.ts',
    code: "export const r = navigator.sendBeacon('/x');",
    rule: 'noJsRestrictedProperties',
  },
  {
    file: 'src/app/p6.ts',
    code: "export const r = globalThis.fetch('/x');",
    rule: 'noJsRestrictedProperties',
  },
  { file: 'src/app/p7.ts', code: 'export const r = browser.storage.sync.get();', rule: 'plugin' },
  {
    file: 'src/app/p8.ts',
    code: 'export const r = chrome.runtime.id;',
    rule: 'noRestrictedGlobals',
  },
];

const security: Case[] = [
  { file: 'src/app/s1.ts', code: "export const r = eval('1');", rule: 'noGlobalEval' },
  {
    file: 'src/app/s2.ts',
    code: "export const r = new Function('return 1');",
    rule: 'noRestrictedGlobals',
  },
  { file: 'src/app/s3.ts', code: "export const r = setTimeout('go()', 1);", rule: 'plugin' },
  {
    file: 'src/app/s4.ts',
    code: "window.postMessage('x', '*');",
    rule: 'noJsRestrictedProperties',
  },
  {
    file: 'src/app/s5.ts',
    code: 'browser.runtime.onMessageExternal.addListener(f);',
    rule: 'noJsRestrictedProperties',
  },
];

const htmlSinks: Case[] = [
  { file: 'src/content/h1.ts', code: 'el.innerHTML = text;', rule: 'plugin' },
  { file: 'src/content/h2.ts', code: 'el.outerHTML = text;', rule: 'plugin' },
  {
    file: 'src/content/h3.ts',
    code: "el.insertAdjacentHTML('beforeend', text);",
    rule: 'noJsRestrictedProperties',
  },
  { file: 'src/content/h4.ts', code: 'document.write(text);', rule: 'noJsRestrictedProperties' },
  { file: 'src/content/h5.ts', code: 'el.setHTMLUnsafe(text);', rule: 'noJsRestrictedProperties' },
  {
    file: 'src/content/h6.ts',
    code: 'range.createContextualFragment(text);',
    rule: 'noJsRestrictedProperties',
  },
  { file: 'src/content/h7.ts', code: 'frame.srcdoc = text;', rule: 'plugin' },
  { file: 'src/content/h8.ts', code: 'el.style.cssText = text;', rule: 'plugin' },
  {
    file: 'src/ui/H9.tsx',
    code: 'export function H({ t }: { t: string }) { return <div dangerouslySetInnerHTML={{ __html: t }} />; }',
    rule: 'noDangerouslySetInnerHtml',
  },
];

const i18n: Case[] = [
  {
    file: 'src/ui/I1.tsx',
    code: 'export function I() { return <p>Hello</p>; }',
    rule: 'noJsxLiterals',
  },
  {
    file: 'src/entrypoints/popup/I2.tsx',
    code: 'export function I() { return <p>Hi</p>; }',
    rule: 'noJsxLiterals',
  },
  {
    file: 'src/ui/I3.tsx',
    code: 'const id = \'root\';\nexport function I() {\n  return <p className="x">{id}</p>;\n}',
    rule: null,
  },
];

const conventions: Case[] = [
  { file: 'src/core/c1.ts', code: 'export default 1;', rule: 'noDefaultExport' },
  { file: 'src/entrypoints/c2.ts', code: 'export default 1;', rule: null },
  { file: 'src/core/c3.ts', code: 'export enum E { A }', rule: 'noEnum' },
  { file: 'src/core/c4.ts', code: "export * from './result';", rule: 'noReExportAll' },
  {
    file: 'src/core/c5.ts',
    code: "export function f(k: 'a' | 'b'): number { switch (k) { case 'a': return 1; } }",
    rule: 'useExhaustiveSwitchCases',
  },
  {
    file: 'src/app/c6.ts',
    code: 'async function go() {}\nexport function run() { go(); }',
    rule: 'noFloatingPromises',
  },
  {
    file: 'src/core/c7.ts',
    code: `export function f() {\n  let a = 0;\n${long(41)}\n  return a;\n}`,
    rule: 'noExcessiveLinesPerFunction',
  },
  {
    file: 'src/core/c8.ts',
    code: Array.from({ length: 201 }, (_, i) => `export const v${i} = ${i};`).join('\n'),
    rule: 'noExcessiveLinesPerFile',
  },
  { file: 'src/core/c9.ts', code: nested, rule: 'noExcessiveCognitiveComplexity' },
  {
    file: 'src/core/cycle-a.ts',
    code: "import { b } from './cycle-b';\nexport const a = () => b;",
    rule: 'noImportCycles',
  },
  {
    file: 'src/core/cycle-b.ts',
    code: "import { a } from './cycle-a';\nexport const b = () => a;",
    rule: 'noImportCycles',
  },
  {
    file: 'src/app/c10.ts',
    code: 'export const x = defineBackground(() => {});',
    rule: 'noUndeclaredVariables',
  },
  { file: 'src/app/c11.ts', code: "console.log('x');", rule: 'noConsole' },
  { file: 'src/app/c12.test.ts', code: "it.only('x', () => {});", rule: 'noFocusedTests' },
  { file: 'src/app/c13.test.ts', code: "describe.skip('x', () => {});", rule: 'noSkippedTests' },
  {
    file: 'src/core/c14.ts',
    code: 'export const n = (x?: number) => x!;',
    rule: 'noNonNullAssertion',
  },
  { file: 'src/core/c15.ts', code: 'export const n = (x: any) => x;', rule: 'noExplicitAny' },
];

const imports = 'noRestrictedImports';

/** D-246: the website reaches the extension only through `@/`, and only core, shared, ui/components,
 * the translator and styles. Nothing under src/ imports the website. */
const websiteZone: Case[] = [
  { file: 'website/src/w1.ts', code: "export { a } from '@/app/ports';", rule: imports },
  { file: 'website/src/w2.ts', code: "export { a } from '@/platform/tabs';", rule: imports },
  { file: 'website/src/w3.ts', code: "export { a } from '@/content/marker/host';", rule: imports },
  {
    file: 'website/src/w4.ts',
    code: "export { A } from '@/entrypoints/popup/App';",
    rule: imports,
  },
  {
    file: 'website/src/w5.ts',
    code: "export { t } from '@/lib/i18n/browser-source';",
    rule: imports,
  },
  { file: 'website/src/w6.ts', code: "export { u } from '@/ui/hooks/use-state';", rule: imports },
  { file: 'website/src/w7.ts', code: "export { browser } from 'wxt/browser';", rule: imports },
  {
    file: 'website/src/pages/w8.ts',
    code: "export { ok } from '../../../src/core/result';",
    rule: imports,
  },
  { file: 'website/scripts/w9.ts', code: "export { a } from '@/app/ports';", rule: imports },
  {
    file: 'src/ui/w10.ts',
    code: "export { a } from '../../website/src/routes/routes';",
    rule: imports,
  },
  { file: 'src/core/w11.ts', code: "export { a } from '../../website/src/x';", rule: imports },
  {
    file: 'src/entrypoints/w12.ts',
    code: "export { a } from '../../website/src/x';",
    rule: imports,
  },
  // Allowed directions stay clean.
  { file: 'website/src/ok1.ts', code: "export { ok } from '@/core/result';", rule: null },
  {
    file: 'website/src/ok2.ts',
    code: "export { v } from '@/shared/marker-view/banner';",
    rule: null,
  },
  { file: 'website/src/ok3.ts', code: "export { B } from '@/ui/components/button';", rule: null },
  {
    file: 'website/src/ok4.ts',
    code: "export { createTranslator } from '@/lib/i18n/translate';",
    rule: null,
  },
  { file: 'website/src/ok5.ts', code: "import '@/styles/base.css';", rule: null },
  {
    file: 'website/src/pages/ok6.ts',
    code: "export { m } from '../content/markdown';",
    rule: null,
  },
  {
    file: 'website/src/i18n/ok7.ts',
    code: "export { default } from '../../../public/_locales/en/messages.json';",
    rule: null,
  },
  { file: 'website/scripts/ok8.ts', code: "export { r } from '../src/routes/routes';", rule: null },
];

const websiteNetwork: Case[] = [
  { file: 'website/src/n1.ts', code: "export const r = fetch('/x');", rule: 'noRestrictedGlobals' },
  {
    file: 'website/src/n2.ts',
    code: 'export const r = new XMLHttpRequest();',
    rule: 'noRestrictedGlobals',
  },
  {
    file: 'website/src/n3.ts',
    code: "export const r = new WebSocket('wss://x');",
    rule: 'noRestrictedGlobals',
  },
  {
    file: 'website/src/n4.ts',
    code: "export const r = navigator.sendBeacon('/x');",
    rule: 'noJsRestrictedProperties',
  },
];

const websiteSinks: Case[] = [
  { file: 'website/src/h1.ts', code: 'el.innerHTML = text;', rule: 'plugin' },
  { file: 'website/src/h2.ts', code: "export const r = eval('1');", rule: 'noGlobalEval' },
  {
    file: 'website/src/h3.ts',
    code: "export const r = new Function('return 1');",
    rule: 'noRestrictedGlobals',
  },
  {
    file: 'website/src/H4.tsx',
    code: 'export function H({ t }: { t: string }) { return <div dangerouslySetInnerHTML={{ __html: t }} />; }',
    rule: 'noDangerouslySetInnerHtml',
  },
];

/** Prerendered `style` attributes would need 'unsafe-inline' in the website CSP. */
const styleAttributes: Case[] = [
  {
    file: 'website/src/S1.tsx',
    code: 'export function S() { return <div style={{ margin: 0 }} />; }',
    rule: 'plugin',
  },
  {
    file: 'website/src/S2.tsx',
    code: "export function S() { return <p style={{ margin: 0 }}>{'x'}</p>; }",
    rule: 'plugin',
  },
  {
    file: 'src/ui/components/S3.tsx',
    code: 'export function S({ c }: { c: string }) { return <span style={{ color: c }} />; }',
    rule: 'plugin',
  },
];

const websiteI18n: Case[] = [
  {
    file: 'website/src/I1.tsx',
    code: 'export function I() { return <p>Hello</p>; }',
    rule: 'noJsxLiterals',
  },
];

const all = [
  ...layers,
  ...privacy,
  ...security,
  ...htmlSinks,
  ...i18n,
  ...conventions,
  ...websiteZone,
  ...websiteNetwork,
  ...websiteSinks,
  ...styleAttributes,
  ...websiteI18n,
];

type Diagnostic = { category: string; location: { path: string } };
let project: string;
let byFile: Map<string, string[]>;

beforeAll(() => {
  project = mkdtempSync(path.join(tmpdir(), 'sitemark-lint-'));
  cpSync('biome.json', path.join(project, 'biome.json'));
  cpSync('tools/biome', path.join(project, 'tools/biome'), { recursive: true });
  for (const { file, code } of all) {
    mkdirSync(path.dirname(path.join(project, file)), { recursive: true });
    writeFileSync(path.join(project, file), `${code}\n`);
  }
  const biome = path.resolve('node_modules/.bin/biome');
  const args = ['lint', '--vcs-enabled=false', '--reporter=json', '--max-diagnostics=none', '.'];
  let out: string;
  try {
    out = execFileSync(biome, args, {
      cwd: project,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (error) {
    out = (error as { stdout: string }).stdout;
  }
  const { diagnostics } = JSON.parse(out) as { diagnostics: Diagnostic[] };
  byFile = new Map();
  for (const d of diagnostics) {
    const file = d.location.path.replaceAll('\\', '/');
    const rule = d.category.startsWith('plugin') ? 'plugin' : (d.category.split('/').at(-1) ?? '');
    byFile.set(file, [...(byFile.get(file) ?? []), rule]);
  }
}, 30_000);

afterAll(() => rmSync(project, { recursive: true, force: true }));

function expectRule({ file, rule }: Case) {
  const rules = byFile.get(file) ?? [];
  if (rule) expect(rules, file).toContain(rule);
  else
    expect(
      rules.filter((r) => r === 'noRestrictedImports' || r === 'noDefaultExport'),
      file,
    ).toEqual([]);
}

describe('REQ-NFR-004 lint enforces the layer zones (D-222)', () => {
  it.each(layers)('$file → $rule', expectRule);
});

describe('REQ-PRIV-005 lint bans network APIs and synced storage', () => {
  it.each(privacy)('$file → $rule', expectRule);
});

describe('REQ-NFR-005 lint bans dynamic code and external messaging', () => {
  it.each(security)('$file → $rule', expectRule);
});

describe('REQ-RND-011 lint bans HTML and CSS-text sinks', () => {
  it.each(htmlSinks)('$file → $rule', expectRule);
});

describe('REQ-I18N-002 lint bans hard-coded JSX text', () => {
  it.each(i18n)('$file → $rule', expectRule);
});

describe('REQ-NFR-004 lint enforces the code conventions (D-235)', () => {
  it.each(conventions)('$file → $rule', expectRule);
});

describe('REQ-WEB-009 lint enforces the website zone (D-246)', () => {
  it.each(websiteZone)('$file → $rule', expectRule);
});

describe('REQ-WEB-003 lint bans network APIs in website code', () => {
  it.each(websiteNetwork)('$file → $rule', expectRule);
});

describe('REQ-WEB-006 lint bans HTML sinks and dynamic code in website code', () => {
  it.each(websiteSinks)('$file → $rule', expectRule);
});

describe('REQ-WEB-005 lint bans style attributes in website code and shared components', () => {
  it.each(styleAttributes)('$file → $rule', expectRule);
});

describe('REQ-WEBUX-003 lint bans hard-coded JSX text in website code', () => {
  it.each(websiteI18n)('$file → $rule', expectRule);
});
