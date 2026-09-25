import logo from '@/assets/logo.svg';
import { t } from '@/lib/i18n';

export function PopupApp() {
  return (
    <main className="sm-popup">
      <header className="sm-popup__header">
        <img src={logo} alt="" width={32} height={32} />
        <h1>{t('popupTitle')}</h1>
      </header>
      <p className="sm-well">{t('scaffoldNotice')}</p>
    </main>
  );
}
