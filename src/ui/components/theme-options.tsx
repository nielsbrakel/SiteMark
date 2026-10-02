import type { Theme } from '@/core/model/schema';
import { MoonIcon, SunIcon, SystemIcon } from './icons';
import type { SegmentedOption } from './Segmented';

const ICONS = { system: <SystemIcon />, light: <SunIcon />, dark: <MoonIcon /> } as const;

/** The options of the icon-only theme switch (a `Segmented`), the same in the extension and on the website. */
export function themeOptions(labels: Readonly<Record<Theme, string>>): SegmentedOption<Theme>[] {
  return (Object.keys(ICONS) as Theme[]).map((theme) => ({
    value: theme,
    label: labels[theme],
    icon: ICONS[theme],
  }));
}
