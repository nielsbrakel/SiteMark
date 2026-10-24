import type { ScreenshotTheme } from '../src/content/screenshots';
import type { Locale } from '../src/i18n/locales';

// The page the screenshots mark (T-230): the admin of the "Leaf & Lamp" shop the website's hero and
// playground show (MockShop), with a customer card, its risky Delete button and recent orders. The
// generators serve it on the hosts the e2e build pre-grants, so no URL in the screenshots carries a port.
// Its colors echo the mock shop's paper tones but belong to the demo shop, not to SiteMark, and its
// status chips stay grey so they never compete with the marks.

type Text = {
  admin: string;
  links: readonly string[];
  stats: readonly (readonly [string, string])[];
  customer: string;
  lastOrder: string;
  remove: string;
  orders: string;
  columns: readonly string[];
  statuses: readonly string[];
};

const TEXT: Record<Locale, Text> = {
  en: {
    admin: 'Admin',
    links: ['Customers', 'Orders', 'Products'],
    stats: [
      ['Orders today', '18'],
      ['Revenue', '€ 1,240'],
      ['Open tickets', '3'],
    ],
    customer: 'Customer',
    lastOrder: 'Last order #1042, 12 Oct',
    remove: 'Delete customer',
    orders: 'Recent orders',
    columns: ['Order', 'Customer', 'Total', 'Status'],
    statuses: ['Paid', 'Shipped', 'Packed', 'Shipped', 'Delivered'],
  },
  nl: {
    admin: 'Beheer',
    links: ['Klanten', 'Bestellingen', 'Producten'],
    stats: [
      ['Bestellingen vandaag', '18'],
      ['Omzet', '€ 1.240'],
      ['Open tickets', '3'],
    ],
    customer: 'Klant',
    lastOrder: 'Laatste bestelling #1042, 12 okt',
    remove: 'Klant verwijderen',
    orders: 'Recente bestellingen',
    columns: ['Bestelling', 'Klant', 'Totaal', 'Status'],
    statuses: ['Betaald', 'Verzonden', 'Ingepakt', 'Verzonden', 'Bezorgd'],
  },
};

const ORDERS = [
  ['#1046', 'Noah de Vries', '€ 84'],
  ['#1045', 'Emma Bakker', '€ 59'],
  ['#1044', 'Mila Jansen', '€ 24'],
  ['#1043', 'Sem Visser', '€ 112'],
  ['#1042', 'Mila Jansen', '€ 43'],
] as const;

const PALETTE: Record<ScreenshotTheme, string> = {
  light:
    '--bg:#fbf6e8;--card:#fffefa;--text:#33261b;--muted:#5c4a3a;--line:rgb(51 38 27/18%);--chip:#efe4cb;--danger:#a63d28',
  dark: '--bg:#241d33;--card:#2f2742;--text:#f7f0e3;--muted:#cdc3dd;--line:rgb(247 240 227/14%);--chip:#3a3150;--danger:#ff9c8c',
};

const STYLE = `body{margin:0;font:18px/1.5 system-ui,sans-serif;background:var(--bg);color:var(--text)}
header{display:flex;gap:28px;align-items:center;padding:18px 48px;border-bottom:1px solid var(--line)}
header b{font-size:22px;margin-right:20px}header span{color:var(--muted)}
main{display:grid;grid-template-columns:400px 1fr;align-items:start;gap:28px;padding:28px 48px}
.stats{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
section{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:18px 24px}
h2{margin:0 0 10px;font-size:15px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.stats strong{font-size:30px}p{margin:0 0 4px;color:var(--muted)}p:first-of-type{font-size:22px;font-weight:600;color:var(--text)}
button{margin-top:20px;font:inherit;font-weight:600;padding:10px 20px;border-radius:4px;border:2px solid var(--danger);background:transparent;color:var(--danger)}
table{width:100%;border-collapse:collapse}td,th{padding:8px 0;text-align:left;border-top:1px solid var(--line)}
th{border:0;padding-top:0;font-size:15px;color:var(--muted);font-weight:600}
td i{font-style:normal;font-size:15px;padding:2px 10px;border-radius:99px;background:var(--chip)}`;

/** The demo page in the screenshot's language and theme. */
export function screenshotPage(locale: Locale, theme: ScreenshotTheme): string {
  const t = TEXT[locale];
  const stats = t.stats.map(
    ([label, value]) => `<section><h2>${label}</h2><strong>${value}</strong></section>`,
  );
  const rows = ORDERS.map(
    (row, i) =>
      `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}<td><i>${t.statuses[i]}</i></td></tr>`,
  );
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>Leaf & Lamp · ${t.admin}</title>
<style>:root{${PALETTE[theme]}}${STYLE}</style></head><body><header><b>Leaf & Lamp · ${t.admin}</b>${t.links
    .map((link) => `<span>${link}</span>`)
    .join('')}</header><main><div class="stats">${stats.join('')}</div>
<section><h2>${t.customer}</h2><p>Mila Jansen</p><p>mila@example.com</p><p>${t.lastOrder}</p>
<button id="delete">${t.remove}</button></section>
<section><h2>${t.orders}</h2><table><tr>${t.columns.map((c) => `<th>${c}</th>`).join('')}</tr>${rows.join('')}</table></section></main></body></html>`;
}
