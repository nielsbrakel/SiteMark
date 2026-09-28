// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { MarkPreview } from '@/ui/components/MarkPreview';
import type { IslandProps } from '../islands/island-props';
import { PLAYGROUND_ADDRESS } from './playground-group';
import type { PlaygroundState } from './playground-state';

type Props = IslandProps & { readonly state: PlaygroundState };

/** The shared mock browser (D-254) with the sample page and its Delete customer button. */
export function PlaygroundPreview({ t }: Props) {
  return (
    <MarkPreview
      plan={{ items: [] }}
      label={t('websitePlaygroundPreview')}
      pageTitle={t('websitePlaygroundPageTitle')}
      address={PLAYGROUND_ADDRESS}
      targetLabel={t('websiteHeroButton')}
      labels={{ collapseBanner: t('markerCollapseBanner'), expandBanner: t('markerExpandBanner') }}
    />
  );
}
