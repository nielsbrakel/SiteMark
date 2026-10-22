// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { useEffect, useRef, useState } from 'react';
import type { IslandProps } from '../islands/island-props';
import styles from './HeroCompare.module.css';
import { HeroShop } from './HeroShop';

/** Where the divider starts (also `--pos` in the CSS): left of the shop's tab, so the marks show at first sight. */
const START = 21;
const GRIP = '↔';

/**
 * The home hero (REQ-PLAY-004): the same shop page without and with SiteMark's marks, with a
 * slider that moves the divider between them. The pictures are drawn in HTML and CSS and hidden
 * from assistive technology; the slider is the control, and the lead text above says what marks do.
 */
export function HeroCompare({ t }: IslandProps) {
  const [position, setPosition] = useState(START);
  const compare = useRef<HTMLDivElement>(null);
  // Set through the CSSOM: a style attribute in the prerendered HTML would need 'unsafe-inline' (REQ-WEB-005).
  useEffect(() => compare.current?.style.setProperty('--pos', `${position}%`), [position]);
  return (
    <div className={styles.compare} data-compare ref={compare}>
      <span className={styles.before}>{t('websiteHeroBefore')}</span>
      <span className={styles.after}>{t('websiteHeroAfter')}</span>
      <div className={`sm-tape ${styles.frame}`}>
        <div className={styles.stack} aria-hidden="true">
          <HeroShop t={t} marked={false} />
          <div className={styles.marked}>
            <HeroShop t={t} marked />
          </div>
          <span className={styles.handle}>
            <span className={styles.grip}>
              {GRIP} {t('websiteHeroDrag')}
            </span>
          </span>
        </div>
        <input
          className={styles.range}
          type="range"
          min={8}
          max={92}
          value={position}
          aria-label={t('websiteHeroSlider')}
          onChange={(event) => setPosition(event.currentTarget.valueAsNumber)}
        />
      </div>
    </div>
  );
}
