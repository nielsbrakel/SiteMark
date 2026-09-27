import type { ReactNode } from 'react';
import { assertNever } from '@/core/result';
import { t } from '@/lib/i18n/browser-source';
import { useSiteMarkState } from '@/ui/hooks/use-site-mark-state';
import { useTheme } from '@/ui/hooks/use-theme';
import { Layout } from './Layout';
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
      return <Layout state={view.state} route={route} />;
    case 'readOnly':
    case 'error':
      return <p role="alert">{t('optionsUnavailable')}</p>;
    default:
      return assertNever(view);
  }
}
