import type { SeoHead } from '../head/seo';
import { assetUrl } from '../routes/urls';

/** The head tags from the SEO data (REQ-SEO-001…004), escaped by React like everything else. */
export function SeoTags({ head }: { head: SeoHead }) {
  return (
    <>
      <title>{head.title}</title>
      <meta name="description" content={head.description} />
      <link rel="canonical" href={head.canonical} />
      {head.alternates.map(({ hreflang, href }) => (
        <link key={hreflang} rel="alternate" hrefLang={hreflang} href={href} />
      ))}
      {head.openGraph.map(({ key, content }) => (
        <meta key={`${key}=${content}`} property={key} content={content} />
      ))}
      {head.twitter.map(({ key, content }) => (
        <meta key={key} name={key} content={content} />
      ))}
      {/* Copied from design/logo and public/icon by the prerender step (design §5). */}
      <link rel="icon" href={assetUrl('favicon.svg')} type="image/svg+xml" />
      <link rel="icon" href={assetUrl('favicon-32.png')} sizes="32x32" type="image/png" />
    </>
  );
}
