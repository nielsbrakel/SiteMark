import type { SeoHead } from '../head/seo';

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
    </>
  );
}
