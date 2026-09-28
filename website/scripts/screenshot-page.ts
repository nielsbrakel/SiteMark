import type { ScreenshotTheme } from '../src/content/screenshots';
import type { Locale } from '../src/i18n/locales';

// The page the screenshots mark (T-230): a small admin app with a scary button, served by the
// generator at http://prod.sitemark.test/ (a pre-granted origin of the e2e build), so no URL in the
// screenshots carries a port. Its colors are the demo app's own, not SiteMark's.

const TEXT: Record<Locale, readonly string[]> = {
  en: ['Acme admin', 'Customers', 'Orders', 'Reports', 'New customer', 'Export', 'Delete customer'],
  nl: [
    'Acme beheer',
    'Klanten',
    'Bestellingen',
    'Rapporten',
    'Nieuwe klant',
    'Exporteren',
    'Klant verwijderen',
  ],
};

const ROWS: Record<Locale, readonly (readonly string[])[]> = {
  en: [
    ['ID', 'Name', 'Plan', 'Status'],
    ['1001', 'Ada Lovelace', 'Enterprise', 'Active'],
    ['1002', 'Grace Hopper', 'Team', 'Active'],
    ['1003', 'Alan Turing', 'Free', 'Suspended'],
    ['1004', 'Edsger Dijkstra', 'Team', 'Active'],
  ],
  nl: [
    ['ID', 'Naam', 'Abonnement', 'Status'],
    ['1001', 'Ada Lovelace', 'Enterprise', 'Actief'],
    ['1002', 'Grace Hopper', 'Team', 'Actief'],
    ['1003', 'Alan Turing', 'Gratis', 'Geschorst'],
    ['1004', 'Edsger Dijkstra', 'Team', 'Actief'],
  ],
};

const PALETTE: Record<ScreenshotTheme, string> = {
  light: '--bg:#f6f8fa;--card:#fff;--text:#1f2328;--muted:#59636e;--line:#d0d7de;--bar:#24292f',
  dark: '--bg:#0d1117;--card:#161b22;--text:#e6edf3;--muted:#9198a1;--line:#30363d;--bar:#010409',
};

const STYLE = `body{margin:0;font:16px/1.5 system-ui,sans-serif;background:var(--bg);color:var(--text)}
header{display:flex;gap:32px;align-items:center;padding:14px 32px;background:var(--bar);color:#fff}
header b{font-size:18px}header span{opacity:.8}main{padding:32px 48px}h1{margin:0 0 24px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:24px;max-width:760px}
.actions{display:flex;gap:12px;margin-bottom:24px}button{font:inherit;padding:8px 16px;border-radius:8px;
border:1px solid var(--line);background:var(--card);color:var(--text)}#delete{background:#cf222e;
border-color:#a40e26;color:#fff}table{border-collapse:collapse;width:100%}th,td{padding:10px 12px;
border-bottom:1px solid var(--line);text-align:left}th{color:var(--muted);font-weight:600}`;

function table(locale: Locale): string {
  const [head = [], ...body] = ROWS[locale];
  const cells = (row: readonly string[], tag: string) =>
    `<tr>${row.map((cell) => `<${tag}>${cell}</${tag}>`).join('')}</tr>`;
  return `<table><thead>${cells(head, 'th')}</thead><tbody>${body.map((row) => cells(row, 'td')).join('')}</tbody></table>`;
}

/** The demo page in the screenshot's language and theme. */
export function screenshotPage(locale: Locale, theme: ScreenshotTheme): string {
  const [app, customers, orders, reports, add, exportLabel, remove] = TEXT[locale];
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>${customers} · ${app}</title>
<style>:root{${PALETTE[theme]}}${STYLE}</style></head><body><header><b>${app}</b><span>${customers}</span>
<span>${orders}</span><span>${reports}</span></header><main><h1>${customers}</h1><div class="card">
<div class="actions"><button>${add}</button><button>${exportLabel}</button>
<button id="delete">${remove}</button></div>${table(locale)}</div></main></body></html>`;
}
