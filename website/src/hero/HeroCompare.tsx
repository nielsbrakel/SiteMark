// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { type PointerEvent, useEffect, useRef, useState } from 'react';
import type { IslandProps } from '../islands/island-props';
import styles from './HeroCompare.module.css';
import { HeroShop } from './HeroShop';

/** Where the divider starts (also `--pos` in the CSS): left of the shop's tab, so the marks show at first sight. */
const START = 21;
const MIN = 8;
const MAX = 92;
const GRIP = '↔';

/**
 * The home hero (REQ-PLAY-004): the same shop page without and with SiteMark's marks, with a
 * slider that moves the divider between them (and dragging the picture does too, for touch screens). The pictures are drawn in HTML and CSS and hidden
 * from assistive technology; the slider is the control, and the lead text above says what marks do.
 */
export function HeroCompare({ t }: IslandProps) {
  const [position, setPosition] = useState(START);
  const compare = useRef<HTMLDivElement>(null);
  // Set through the CSSOM: a style attribute in the prerendered HTML would need 'unsafe-inline' (REQ-WEB-005).
  useEffect(() => compare.current?.style.setProperty('--pos', `${position}%`), [position]);
  const dragging = useRef(false);
  const moveTo = (event: PointerEvent<HTMLElement>) => {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    const percent = ((event.clientX - left) / width) * 100;
    setPosition(Math.round(Math.min(MAX, Math.max(MIN, percent))));
  };
  const drag = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      dragging.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      moveTo(event);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => dragging.current && moveTo(event),
    onPointerUp: () => {
      dragging.current = false;
    },
  };
  return (
    <div className={styles.compare} data-compare ref={compare}>
      <span className={styles.before}>{t('websiteHeroBefore')}</span>
      <span className={styles.after}>{t('websiteHeroAfter')}</span>
      <div className={`sm-tape ${styles.frame}`} data-drag {...drag}>
        <div className={styles.stack} aria-hidden="true">
          <HeroShop t={t} marked={false} />
          <div className={styles.marked}>
            <HeroShop t={t} marked />
          </div>
          <span className={styles.handle}>
            <span className={styles.grip}>
              <svg className={styles.arrows} viewBox="0 0 26 26" aria-hidden="true">
                <path d="M9 7l-6 6 6 6M17 7l6 6-6 6M4 13h18" />
              </svg>
            </span>
          </span>
        </div>
        <input
          className={styles.range}
          type="range"
          min={MIN}
          max={MAX}
          value={position}
          aria-label={t('websiteHeroSlider')}
          onChange={(event) => setPosition(event.currentTarget.valueAsNumber)}
        />
      </div>
      <p className={styles.hint}>
        {GRIP} {t('websiteHeroHint')}
      </p>
    </div>
  );
}
