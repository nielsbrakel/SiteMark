import '@/styles/base.css';
import './styles/website-tokens.css';
// Only for their CSS and images: pages are static HTML and no page code runs in the browser
// (scripts/keep-css-modules.ts keeps the CSS of these otherwise tree-shaken modules).
import './pages/PageView';
import './pages/registry';
import { hydrateIslands } from './hydrate';

// Every page is a prerendered HTML file; this hydrates its interactive islands (no client router).
void hydrateIslands(document);
