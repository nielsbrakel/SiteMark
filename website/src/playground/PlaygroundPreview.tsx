// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { useMemo } from 'react';
import { MarkPreview } from '@/ui/components/MarkPreview';
import type { IslandProps } from '../islands/island-props';
import { PLAYGROUND_ADDRESS } from './playground-group';
import { playgroundPlan } from './playground-plan';
import type { PlaygroundState } from './playground-state';

type Props = IslandProps & { readonly state: PlaygroundState };

/**
 * The shared mock browser (D-254) with the sample page and its Delete customer button, marked by
 * the extension's compose and marker views. The marks are drawn in the browser only (a layout
 * effect), so the prerendered page shows the empty window.
 */
export function PlaygroundPreview({ t, state }: Props) {
  const plan = useMemo(() => playgroundPlan(state), [state]);
  return (
    <MarkPreview
      plan={plan}
      label={t('websitePlaygroundPreview')}
      pageTitle={t('websitePlaygroundPageTitle')}
      address={PLAYGROUND_ADDRESS}
      targetLabel={t('websiteHeroButton')}
      labels={{ collapseBanner: t('markerCollapseBanner'), expandBanner: t('markerExpandBanner') }}
    />
  );
}
