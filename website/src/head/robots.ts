import { absoluteUrl } from '../routes/urls';

/** robots.txt: everything may be crawled, and the sitemap is announced (REQ-SEO-003). */
export function robotsTxt(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('sitemap.xml')}\n`;
}
