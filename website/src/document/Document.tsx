import type { ReactNode } from 'react';
import type { Locale } from '../i18n/locales';
import type { PageId } from '../routes/routes';

type DocumentProps = {
  locale: Locale;
  page: PageId;
  title: string;
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
export function Document({ locale, page, title, script, styles, children }: DocumentProps) {
  return (
    <html lang={locale} data-route={page} data-locale={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        {styles.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body>
        <div id="root">{children}</div>
        <script type="module" src={script} />
      </body>
    </html>
  );
}
