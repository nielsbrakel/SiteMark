import type { ReactNode } from 'react';
import { referrerPolicy } from '../head/csp';
import type { SeoHead } from '../head/seo';
import type { Locale } from '../i18n/locales';
import type { PageId } from '../routes/routes';
import { SeoTags } from './SeoTags';

type DocumentProps = {
  locale: Locale;
  page: PageId;
  head: SeoHead;
  /** The Content-Security-Policy (REQ-WEB-005), pinning the bootstrap's hash. */
  csp: string;
  /** JSON-LD text for the home routes (REQ-SEO-005): data, never run. */
  jsonLd?: string | undefined;
  /** The inline theme bootstrap (REQ-WEBUX-002): the only inline script. */
  bootstrap: string;
  /** Absolute URLs under the base path. */
  script: string;
  styles: readonly string[];
  /** The page, rendered into #root, which is all the browser hydrates. */
  children: ReactNode;
};

/**
 * The whole HTML document, rendered by React at build time so every attribute and text is escaped
 * by one renderer. `data-route` and `data-locale` tell the client what to hydrate.
 */
export function Document(props: DocumentProps) {
  const { locale, page, head, csp, jsonLd, bootstrap, script, styles, children } = props;
  return (
    <html lang={locale} data-route={page} data-locale={locale}>
      <head>
        <meta charSet="utf-8" />
        {/* First, so it governs every script, style and image after it. */}
        <meta httpEquiv="Content-Security-Policy" content={csp} />
        <meta name="referrer" content={referrerPolicy()} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <SeoTags head={head} />
        {styles.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        {/* Before first paint: applies the stored theme and sets data-js (React leaves it as is). */}
        <script>{bootstrap}</script>
        {jsonLd && <script type="application/ld+json">{jsonLd}</script>}
      </head>
      <body>
        <div id="root">{children}</div>
        <script type="module" src={script} />
      </body>
    </html>
  );
}
