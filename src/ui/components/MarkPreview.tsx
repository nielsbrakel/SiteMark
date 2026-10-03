import { type ReactNode, type RefObject, useLayoutEffect, useRef } from 'react';
import type { RenderItem, RenderPlan } from '../../core/render/render-plan';
import { createView } from '../../shared/marker-view/create-view';
import type { EffectView, ViewLabels } from '../../shared/marker-view/effect-view';
import { classNames } from './class-names';
import styles from './MarkPreview.module.css';
import { paintColor } from './paint';
import { previewContainer, rectIn } from './preview-shadow';

export type MarkPreviewProps = {
  /** What to draw: a render plan from `compose`, like a tab gets. */
  readonly plan: RenderPlan;
  /** The figure's accessible name, already translated. */
  readonly label: string;
  /** The mock page's title in the mock tab (a title prefix goes in front). */
  readonly pageTitle: string;
  /** The mock address bar's text. */
  readonly address: string;
  readonly labels: ViewLabels;
  /** The text of the element that element marks mark (the website's "Delete customer" button). */
  readonly targetLabel?: string;
  /**
   * Replaces the default placeholder page (the website draws a sample shop). Decorative. A function
   * gets the element that element marks mark, to place it in the page.
   */
  readonly children?: ReactNode | ((target: ReactNode) => ReactNode);
  /** Extra class for the figure, e.g. to set `--sm-preview-height`. */
  readonly className?: string | undefined;
};

type Refs = {
  readonly host: RefObject<HTMLDivElement | null>;
  readonly target: RefObject<HTMLDivElement | null>;
};

/** Draws the plan's items with the shared marker views, redrawn when the plan changes. */
function useMarkViews(plan: RenderPlan, { collapseBanner, expandBanner }: ViewLabels, refs: Refs) {
  const collapsed = useRef(new Set<string>());
  useLayoutEffect(() => {
    const host = refs.host.current;
    const target = refs.target.current;
    if (!host) return;
    const labels = { collapseBanner, expandBanner };
    const ctx = { container: previewContainer(host), collapsedBanners: collapsed.current, labels };
    const views: EffectView[] = [];
    for (const item of plan.items) {
      const view = createView(item, ctx);
      if (view && item.target !== 'page' && target) view.setRect(rectIn(target, host));
      if (view) views.push(view);
    }
    return () => {
      for (const view of views) view.dispose();
    };
  }, [plan, collapseBanner, expandBanner, refs]);
}

type ItemOf<E extends RenderItem['effect']> = Extract<RenderItem, { effect: E }>;

function itemOf<E extends RenderItem['effect']>(plan: RenderPlan, effect: E) {
  return plan.items.find((item): item is ItemOf<E> => item.effect === effect);
}

/**
 * A mock browser window marked like a real tab (REQ-MARK-013, D-254): the same `shared/marker-view`
 * code draws the plan in a shadow root over a mock page, the title prefix shows in the mock tab
 * and the favicon tint as a dot. Presentational: the caller composes the plan.
 */
export function MarkPreview({
  plan,
  label,
  pageTitle,
  address,
  labels,
  targetLabel,
  children,
  className,
}: MarkPreviewProps): ReactNode {
  const refs = useRef<Refs>({ host: { current: null }, target: { current: null } }).current;
  useMarkViews(plan, labels, refs);
  const prefix = itemOf(plan, 'titlePrefix')?.params.text;
  const favicon = itemOf(plan, 'favicon');
  const targetElement = (
    <div ref={refs.target} className={targetLabel ? styles.button : styles.target}>
      {targetLabel}
    </div>
  );
  return (
    <figure aria-label={label} className={classNames(styles.preview, className)}>
      <div className={styles.chrome}>
        <span className={styles.tab}>
          <span
            className={styles.favicon}
            data-tinted={favicon !== undefined}
            ref={(dot) => paintColor(dot, '--sm-preview-favicon', favicon?.color ?? '')}
          />
          {prefix ? `${prefix} ${pageTitle}` : pageTitle}
        </span>
        <span className={styles.address}>{address}</span>
      </div>
      <div className={styles.viewport}>
        <div className={children ? styles.sample : styles.page} aria-hidden="true">
          {typeof children === 'function'
            ? children(targetElement)
            : (children ?? (
                <>
                  <span className={styles.line} />
                  <span className={styles.line} />
                  {targetElement}
                  <span className={styles.line} />
                </>
              ))}
        </div>
        <div ref={refs.host} data-marker-host="" className={styles.host} />
      </div>
    </figure>
  );
}
