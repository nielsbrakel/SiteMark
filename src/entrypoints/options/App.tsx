import logo from '@/assets/logo.svg';
import { t } from '@/lib/i18n';

export function OptionsApp() {
  return (
    <main className="sm-options">
      <header className="sm-options__header">
        <img src={logo} alt="" width={32} height={32} />
        <h1>{t('optionsTitle')}</h1>
      </header>
      <p className="sm-well">{t('scaffoldNotice')}</p>
    </main>
  );
}
