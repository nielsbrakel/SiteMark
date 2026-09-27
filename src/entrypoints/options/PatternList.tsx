import type { ReactNode } from 'react';
import { originsOfPattern } from '@/core/data/origins';
import type { SiteGroup, UrlPattern } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { IconButton } from '@/ui/components/IconButton';
import { CloseIcon } from '@/ui/components/icons';
import { sendCommand } from '@/ui/hooks/use-command';
import { commandErrorText } from './command-error';
import { GrantStatus } from './GrantStatus';
import type { Notify } from './notify';
import styles from './PatternEditor.module.css';

export type PatternListProps = {
  readonly group: SiteGroup;
  /** The id of the heading that names the list. */
  readonly labelledBy: string;
  readonly notify: Notify;
};

async function remove(group: SiteGroup, pattern: UrlPattern, notify: Notify): Promise<void> {
  const command = { type: 'removePattern', groupId: group.id, patternId: pattern.id } as const;
  const result = await sendCommand(command);
  if (!result.ok) return notify({ text: commandErrorText(result.error) });
  // REQ-GRP-002: the last pattern took the group's enabled state with it.
  if (result.value.notices.includes('siteGroupAutoDisabled')) {
    notify({ text: t('optionsAutoDisabled', group.name) });
  }
}

/** The site group's URL patterns (REQ-OPT-002), each with its regex origins and Remove. */
export function PatternList({ group, labelledBy, notify }: PatternListProps): ReactNode {
  return (
    <ul aria-labelledby={labelledBy} className={styles.list}>
      {group.patterns.map((pattern) => (
        <li key={pattern.id} className={styles.item}>
          <span className={styles.value}>
            <code>{pattern.value}</code>
            {pattern.kind === 'regex' && (
              <span className={styles.origins}>
                {t('optionsRegexOn', pattern.origins.join(', '))}
              </span>
            )}
          </span>
          <GrantStatus origins={originsOfPattern(pattern)} />
          <IconButton
            label={t('optionsRemovePattern', pattern.value)}
            icon={<CloseIcon />}
            onClick={() => void remove(group, pattern, notify)}
          />
        </li>
      ))}
    </ul>
  );
}
