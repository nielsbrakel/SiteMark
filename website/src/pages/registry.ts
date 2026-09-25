import type { ReactNode } from 'react';
import type { WebsiteMessageKey } from '../i18n/website-t';
import { currentMilestone, type PageId, publishedRoutes, type Route } from '../routes/routes';
import { HomePage } from './HomePage';
import type { PageProps } from './page-props';

export type Page = {
  readonly Component: (props: PageProps) => ReactNode;
  /** The document title (T-210 replaces this with the full SEO head). */
  readonly title: WebsiteMessageKey;
};

// The pages built so far. A published route without a page isn't rendered yet; the tasks that
// build the privacy, support and later pages add them here.
const PAGES: Partial<Record<PageId, Page>> = {
  home: { Component: HomePage, title: 'websiteHomeTitle' },
};

/** The page for a route's page ID, or undefined (also for anything that isn't a page ID). */
export function pageFor(id: string): Page | undefined {
  return Object.hasOwn(PAGES, id) ? PAGES[id as PageId] : undefined;
}

/** Published routes that have a page: the ones that are rendered and may be linked. */
export function renderedRoutes(): readonly Route[] {
  return publishedRoutes(currentMilestone()).filter((route) => pageFor(route.page));
}
