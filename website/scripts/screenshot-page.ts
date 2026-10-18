import type { ScreenshotTheme } from '../src/content/screenshots';
import type { Locale } from '../src/i18n/locales';

// The page the screenshots mark (T-230): the same "Leaf & Lamp" shop the website's hero and playground
// show (MockShop), now with real text, served by the generator at http://prod.sitemark.test/ (a
// pre-granted origin of the e2e build), so no URL in the screenshots carries a port. Its colors
// echo the mock shop's paper tones but belong to the demo shop, not to SiteMark.

type Text = {
  brand: string;
  links: readonly string[];
  headline: string;
  lead: string;
  remove: string;
  products: readonly (readonly [string, string])[];
};

const TEXT: Record<Locale, Text> = {
  en: {
    brand: 'Leaf & Lamp',
    links: ['Plants', 'Lamps', 'Orders'],
    headline: 'Calm corners for slow mornings',
    lead: 'Plants, pots and warm lamps, delivered to your door.',
    remove: 'Delete customer',
    products: [
      ['Monstera', '€ 24'],
      ['Brass desk lamp', '€ 59'],
      ['Clay pot set', '€ 18'],
    ],
  },
  nl: {
    brand: 'Leaf & Lamp',
    links: ['Planten', 'Lampen', 'Bestellingen'],
    headline: 'Rustige hoekjes voor trage ochtenden',
    lead: 'Planten, potten en warme lampen, bij je thuisbezorgd.',
    remove: 'Klant verwijderen',
    products: [
      ['Monstera', '€ 24'],
      ['Messing bureaulamp', '€ 59'],
      ['Set kleipotten', '€ 18'],
    ],
  },
};

const PALETTE: Record<ScreenshotTheme, string> = {
  light:
    '--bg:#fbf6e8;--text:#33261b;--muted:#5c4a3a;--line:rgb(51 38 27/18%);--block:#33261b;--thumb:#a89883;--danger:#a63d28',
  dark: '--bg:#2e2745;--text:#f6efe0;--muted:#c2b8d6;--line:rgb(246 239 224/14%);--block:#f6efe0;--thumb:#6b6285;--danger:#ff9a8a',
};

const STYLE = `body{margin:0;font:18px/1.5 system-ui,sans-serif;background:var(--bg);color:var(--text)}
header{display:flex;gap:20px;align-items:center;padding:20px 48px;border-bottom:1px solid var(--line)}
header i{width:24px;height:24px;border-radius:50%;background:var(--muted)}header b{font-size:20px;margin-right:16px}
header span{color:var(--muted)}main{display:grid;gap:40px;padding:40px 48px;max-width:1000px}
.hero{display:grid;grid-template-columns:1.2fr 1fr;gap:32px;align-items:center}
h1{margin:0 0 12px;font-size:40px;line-height:1.15}p{margin:0 0 24px;color:var(--muted)}
.picture{height:200px;border-radius:6px;background:var(--block)}
button{font:inherit;font-weight:600;padding:10px 20px;border-radius:4px;border:2px solid var(--danger);
background:transparent;color:var(--danger)}
.products{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.thumb{height:140px;border-radius:4px;background:var(--thumb);opacity:.6;margin-bottom:8px}
.products span{color:var(--muted)}`;

/** The demo page in the screenshot's language and theme. */
export function screenshotPage(locale: Locale, theme: ScreenshotTheme): string {
  const { brand, links, headline, lead, remove, products } = TEXT[locale];
  const items = products
    .map(([name, price]) => `<div><div class="thumb"></div>${name}<br><span>${price}</span></div>`)
    .join('');
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>${brand}</title>
<style>:root{${PALETTE[theme]}}${STYLE}</style></head><body><header><i></i><b>${brand}</b>${links
    .map((link) => `<span>${link}</span>`)
    .join('')}</header><main><div class="hero"><div><h1>${headline}</h1><p>${lead}</p>
<button id="delete">${remove}</button></div><div class="picture"></div></div>
<div class="products">${items}</div></main></body></html>`;
}
