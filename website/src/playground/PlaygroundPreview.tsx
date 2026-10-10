// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { useMemo } from 'react';
import { MarkPreview } from '@/ui/components/MarkPreview';
import type { IslandProps } from '../islands/island-props';
import { MockShop } from './MockShop';
import styles from './Playground.module.css';
import { PLAYGROUND_ADDRESS } from './playground-group';
import { playgroundPlan } from './playground-plan';
import type { PlaygroundState } from './playground-state';
import { playgroundSummary } from './playground-summary';

type Props = IslandProps & { readonly state: PlaygroundState };

/**
 * The shared mock browser (D-254) with a sample web shop, marked by the extension's compose and
 * marker views. The marks are drawn in the browser only (a layout
 * effect), so the prerendered page shows the empty window. A status line says in words what the
 * preview shows (REQ-PLAY-005).
 */
export function PlaygroundPreview({ t, state }: Props) {
  const plan = useMemo(() => playgroundPlan(state), [state]);
  return (
    <>
      <MarkPreview
        plan={plan}
        label={t('websitePlaygroundPreview')}
        pageTitle={t('websitePlaygroundPageTitle')}
        address={PLAYGROUND_ADDRESS}
        className={styles.mock}
        targetLabel={t('websitePlaygroundDeleteButton')}
        labels={{
          collapseBanner: t('markerCollapseBanner'),
          expandBanner: t('markerExpandBanner'),
        }}
      >
        {(button) => <MockShop brand={t('websitePlaygroundPageTitle')} button={button} />}
      </MarkPreview>
      <p role="status" className="sm-visually-hidden">
        {playgroundSummary(state, t)}
      </p>
    </>
  );
}
