import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { browser } from 'wxt/browser';
import { t } from '@/lib/i18n/browser-source';
import { Button } from '@/ui/components/Button';
import { Dialog } from '@/ui/components/Dialog';
import { commandErrorText } from './command-error';
import type { Notify } from './notify';
import styles from './Pane.module.css';
import { sendTracked } from './save-status';

type Step = 'closed' | 'first' | 'second';

/** Removes SiteMark's access to every site it was granted (it has no required host permissions). */
async function revokeAll(): Promise<void> {
  const { origins = [] } = await browser.permissions.getAll();
  if (origins.length > 0) await browser.permissions.remove({ origins });
}

/**
 * Reset everything (REQ-OPT-005): two confirmations, then resetAll (the background unregisters the
 * marker) and, if chosen, the access to every site is removed. The second step's text takes focus,
 * so it is read out (WCAG 2.4.3).
 */
export function ResetSection({ notify }: { readonly notify: Notify }): ReactNode {
  const headingId = useId();
  const [step, setStep] = useState<Step>('closed');
  const [revoke, setRevoke] = useState(false);
  const [isDone, setDone] = useState(false);
  const body = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (step === 'second') body.current?.focus();
  }, [step]);
  const reset = async () => {
    setStep('closed');
    if (revoke) await revokeAll().catch(() => undefined);
    const result = await sendTracked({ type: 'resetAll' });
    if (result.ok) setDone(true);
    else notify({ text: commandErrorText(result.error) });
  };
  const isFirst = step === 'first';
  return (
    <section className={styles.pane} aria-labelledby={headingId}>
      <h3 id={headingId}>{t('optionsResetHeading')}</h3>
      <p>{t('optionsResetHelp')}</p>
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={revoke}
          onChange={(event) => setRevoke(event.target.checked)}
        />
        {t('optionsResetRevoke')}
      </label>
      <div>
        <Button onClick={() => setStep('first')}>{t('optionsReset')}</Button>
      </div>
      <p aria-live="polite">{isDone ? t('optionsResetDone') : ''}</p>
      <Dialog
        open={step !== 'closed'}
        onClose={() => setStep('closed')}
        title={t(isFirst ? 'optionsResetTitle' : 'optionsResetConfirmTitle')}
        actions={
          <>
            <Button onClick={() => setStep('closed')}>{t('optionsCancel')}</Button>
            <Button variant="primary" onClick={() => (isFirst ? setStep('second') : void reset())}>
              {t(isFirst ? 'optionsContinue' : 'optionsReset')}
            </Button>
          </>
        }
      >
        <p ref={body} tabIndex={-1}>
          {t(isFirst ? 'optionsResetBody' : 'optionsResetConfirmBody')}
        </p>
      </Dialog>
    </section>
  );
}
