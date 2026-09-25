/** Website milestones (D-253): W1 before the store release, W2 after M6. */
export type WebsiteMilestone = 'W1' | 'W2';

export type PageId = 'home' | 'help' | 'playground' | 'support' | 'privacy' | 'changelog';

/** One page of the website (docs/website/spec.md §6). Pure data: no components, no URLs. */
export type Route = {
  readonly page: PageId;
  /** The path below the base path and the locale prefix: '' for home, else `<name>/`. */
  readonly slug: string;
  /** The milestone that ships the page; it is hidden until then (REQ-PAGE-007). */
  readonly milestone: WebsiteMilestone;
  /** Store listings link here, so the URL never moves (REQ-POLICY-005). */
  readonly stable: boolean;
  /** Shown in the header navigation (the wordmark links home, the footer has the rest). */
  readonly nav: boolean;
};

const MILESTONES: readonly WebsiteMilestone[] = ['W1', 'W2'];

const ROUTES: readonly Route[] = [
  { page: 'home', slug: '', milestone: 'W1', stable: false, nav: false },
  { page: 'help', slug: 'help/', milestone: 'W2', stable: false, nav: true },
  { page: 'playground', slug: 'playground/', milestone: 'W2', stable: false, nav: true },
  { page: 'support', slug: 'support/', milestone: 'W1', stable: true, nav: true },
  { page: 'privacy', slug: 'privacy/', milestone: 'W1', stable: true, nav: true },
  { page: 'changelog', slug: 'changelog/', milestone: 'W2', stable: false, nav: false },
];

/** Every route, in navigation order. */
export function routeTable(): readonly Route[] {
  return ROUTES;
}

/** The milestone the website is built for. */
export function currentMilestone(): WebsiteMilestone {
  return 'W1';
}

/** Routes whose milestone is finished at `current`. */
export function publishedRoutes(current: WebsiteMilestone): readonly Route[] {
  const reached = MILESTONES.indexOf(current);
  return ROUTES.filter((route) => MILESTONES.indexOf(route.milestone) <= reached);
}

/** Published routes that appear in the header navigation. */
export function navRoutes(current: WebsiteMilestone): readonly Route[] {
  return publishedRoutes(current).filter((route) => route.nav);
}
