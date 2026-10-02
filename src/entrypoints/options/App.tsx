import type { ReactNode } from 'react';
import { assertNever } from '@/core/result';
import { t } from '@/lib/i18n/browser-source';
import { TranslateContext } from '@/ui/components/mark-form/translate';
import { useSiteMarkState } from '@/ui/hooks/use-site-mark-state';
import { useTheme } from '@/ui/hooks/use-theme';
import { Layout } from './Layout';
import { ReadOnlyBanner } from './ReadOnlyBanner';
import { useHashRoute } from './use-hash-route';

/**
 * The options page (REQ-OPT-001): the site group list in a sidebar, the editor pane, and hash routes
 * for deep links (`#/groups/:id`, `#/settings`, `#/data`, `#/welcome`). It reads the state live and
 * changes it only through commands to the background (D-220).
 */
export function OptionsApp(): ReactNode {
  const view = useSiteMarkState();
  const route = useHashRoute();
  useTheme(view.status === 'ready' ? view.state.settings.theme : undefined);
  switch (view.status) {
    case 'loading':
      return <p role="status">{t('optionsLoading')}</p>;
    case 'ready':
      return (
        <TranslateContext value={t}>
          <Layout state={view.state} route={route} />
        </TranslateContext>
      );
    case 'readOnly':
      return <ReadOnlyBanner schemaVersion={view.schemaVersion} />;
    case 'error':
      return <p role="alert">{t('optionsUnavailable')}</p>;
    default:
      return assertNever(view);
  }
}
