// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import type { ReactNode } from 'react';
import { agentsContentFor } from '../content/agents';
import type { Locale } from '../i18n/locales';
import type { WebsiteMessageKey, WebsiteTranslator } from '../i18n/website-t';
import { currentMilestone, type PageId, publishedRoutes, type Route } from '../routes/routes';
import { AgentsPage } from './AgentsPage';
import { ChangelogPage } from './ChangelogPage';
import { HelpPage } from './HelpPage';
import { HelpTopicPage, helpTopicOf } from './HelpTopicPage';
import { HomePage } from './HomePage';
import { PlaygroundPage } from './PlaygroundPage';
import { PrivacyPage } from './PrivacyPage';
import type { PageProps } from './page-props';
import { SupportPage } from './SupportPage';

export type Page = {
  readonly Component: (props: PageProps) => ReactNode;
  /** The document title: unique per locale, ≤ 60 characters (REQ-SEO-001). */
  readonly title: WebsiteMessageKey;
  /** The meta description: unique per locale, ≤ 160 characters (REQ-SEO-001). */
  readonly description: WebsiteMessageKey;
  /** The title and description of a page whose text isn't in the catalogs (help topics). */
  readonly head?: (
    route: Route,
    locale: Locale,
    t: WebsiteTranslator['t'],
  ) => { title: string; description: string };
};

// The pages built so far. A published route without a page isn't rendered yet; the tasks that
// build the privacy, support and later pages add them here.
const PAGES: Partial<Record<PageId, Page>> = {
  home: { Component: HomePage, title: 'websiteHomeTitle', description: 'websiteHomeDescription' },
  help: { Component: HelpPage, title: 'websiteHelpTitle', description: 'websiteHelpDescription' },
  helpTopic: {
    Component: HelpTopicPage,
    title: 'websiteHelpTitle',
    description: 'websiteHelpDescription',
    head: (route, locale, t) => {
      const { title, description } = helpTopicOf(route, locale);
      return { title: t('websiteHelpTopicTitle', [title]), description };
    },
  },
  playground: {
    Component: PlaygroundPage,
    title: 'websitePlaygroundTitle',
    description: 'websitePlaygroundDescription',
  },
  support: {
    Component: SupportPage,
    title: 'websiteSupportTitle',
    description: 'websiteSupportDescription',
  },
  privacy: {
    Component: PrivacyPage,
    title: 'websitePrivacyTitle',
    description: 'websitePrivacyDescription',
  },
  changelog: {
    Component: ChangelogPage,
    title: 'websiteChangelogTitle',
    description: 'websiteChangelogDescription',
  },
  agents: {
    Component: AgentsPage,
    title: 'websiteNavAgents',
    description: 'websiteNavAgents',
    head: (_route, locale) => agentsContentFor(locale),
  },
};

/** The page for a route's page ID, or undefined (also for anything that isn't a page ID). */
export function pageFor(id: string): Page | undefined {
  return Object.hasOwn(PAGES, id) ? PAGES[id as PageId] : undefined;
}

/** Published routes that have a page: the ones that are rendered and may be linked. */
export function renderedRoutes(): readonly Route[] {
  return publishedRoutes(currentMilestone()).filter((route) => pageFor(route.page));
}
