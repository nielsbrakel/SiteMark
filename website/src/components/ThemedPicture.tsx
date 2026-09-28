import type { ScreenshotFormat, ScreenshotTheme } from '../content/screenshots';
import { screenshotThemes } from '../content/screenshots';
import { assetUrl } from '../routes/urls';
import styles from './ThemedPicture.module.css';

type Props = {
  /** The file of the image below website/public, per theme and format. */
  readonly file: (theme: ScreenshotTheme, format: ScreenshotFormat) => string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly className?: string | undefined;
};

/**
 * A generated image in both themes, WebP first with a PNG fallback. CSS shows the active theme's
 * (the OS unless <html data-theme> overrides it); the other one is lazy and never loads.
 */
export function ThemedPicture({ file, alt, width, height, className }: Props) {
  return screenshotThemes().map((theme) => (
    <picture key={theme} data-theme={theme} className={styles[theme]}>
      <source type="image/webp" srcSet={assetUrl(file(theme, 'webp'))} />
      <img
        className={className}
        src={assetUrl(file(theme, 'png'))}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
      />
    </picture>
  ));
}
