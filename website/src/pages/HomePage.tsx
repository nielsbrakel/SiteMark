import type { PageProps } from './page-props';

/** A minimal home page until T-216 builds the real one (hero, highlights, install buttons). */
export function HomePage({ t }: PageProps) {
  return (
    <>
      <h1>{t('websiteHomeHeading')}</h1>
      <p>{t('websiteHomeLead')}</p>
    </>
  );
}
