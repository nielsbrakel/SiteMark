import { type HelpTopicContent, helpTopicsFor } from '../content/help';
import { Markdown } from '../content/markdown';
import type { Locale } from '../i18n/locales';
import { helpTopicPath, pagePath } from '../routes/urls';
import styles from './HelpPage.module.css';
import type { PageProps } from './page-props';

type TopicsProps = Pick<PageProps, 't' | 'locale'> & { current: HelpTopicContent };

/** Every topic next to the text: a list above it on small screens, a sidebar on wide ones. */
function TopicList({ t, locale, current }: TopicsProps) {
  return (
    <nav className={styles.topics} aria-label={t('websiteHelpTopicsLabel')}>
      <ul>
        <li>
          <a href={pagePath('help', locale)}>{t('websiteHelpIndexLink')}</a>
        </li>
        {helpTopicsFor(locale).map(({ topic, title }) => (
          <li key={topic}>
            <a
              href={helpTopicPath(topic, locale)}
              aria-current={topic === current.topic ? 'page' : undefined}
            >
              {title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** The content of a help topic route (a route without a topic is a bug in the route table). */
export function helpTopicOf(route: PageProps['route'], locale: Locale): HelpTopicContent {
  const content = helpTopicsFor(locale).find((entry) => entry.topic === route.topic);
  if (!content) throw new Error(`No help topic for the route ${route.slug}`);
  return content;
}

/** A help topic (REQ-PAGE-004): its title as the h1, its Markdown, and the list of topics. */
export function HelpTopicPage({ t, locale, route }: PageProps) {
  const content = helpTopicOf(route, locale);
  return (
    <div className={styles.topicPage}>
      <TopicList t={t} locale={locale} current={content} />
      <article className={styles.article}>
        <h1>{content.title}</h1>
        <Markdown source={content.body} file={content.file} />
      </article>
    </div>
  );
}
