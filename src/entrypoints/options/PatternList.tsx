import type { ReactNode } from 'react';
import type { Command } from '@/core/commands/command';
import { originsOfPattern } from '@/core/data/origins';
import type { SiteGroup, UrlPattern } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { IconButton } from '@/ui/components/IconButton';
import { CloseIcon } from '@/ui/components/icons';
import { commandErrorText } from './command-error';
import { GrantStatus } from './GrantStatus';
import type { Notify } from './notify';
import styles from './PatternEditor.module.css';
import type { PatternListKind } from './pattern-lists';
import { type OfferRevoke, useOfferRevoke } from './revoke-prompt';
import { sendTracked } from './save-status';

export type PatternListProps = {
  readonly group: SiteGroup;
  readonly list: PatternListKind;
  /** The id of the heading that names the list. */
  readonly labelledBy: string;
  readonly notify: Notify;
};

function removeCommand(list: PatternListKind, group: SiteGroup, pattern: UrlPattern): Command {
  const target = { groupId: group.id, patternId: pattern.id };
  return list === 'patterns'
    ? { type: 'removePattern', ...target }
    : { type: 'removeExclude', ...target };
}

async function remove(
  props: PatternListProps,
  pattern: UrlPattern,
  offerRevoke: OfferRevoke,
): Promise<void> {
  const { list, group, notify } = props;
  const result = await sendTracked(removeCommand(list, group, pattern));
  if (!result.ok) return notify({ text: commandErrorText(result.error) });
  if (list === 'excludes') return;
  // REQ-GRP-002: the last pattern took the group's enabled state with it; the revoke offer
  // (REQ-PRIV-004) follows that notice.
  if (result.value.notices.includes('siteGroupAutoDisabled')) {
    notify({ text: t('optionsAutoDisabled', group.name), onExpire: offerRevoke });
  } else {
    offerRevoke();
  }
}

/**
 * A site group's URL patterns or excludes (REQ-OPT-002, REQ-URL-008), each with its regex origins
 * and Remove. URL patterns also show their grant (REQ-PRIV-002); excludes need none.
 */
export function PatternList(props: PatternListProps): ReactNode {
  const { group, list, labelledBy } = props;
  const offerRevoke = useOfferRevoke();
  return (
    <ul aria-labelledby={labelledBy} className={styles.list}>
      {group[list].map((pattern) => (
        <li key={pattern.id} className={styles.item}>
          <span className={styles.value}>
            <code>{pattern.value}</code>
            {pattern.kind === 'regex' && (
              <span className={styles.origins}>
                {t('optionsRegexOn', pattern.origins.join(', '))}
              </span>
            )}
          </span>
          {list === 'patterns' && <GrantStatus origins={originsOfPattern(pattern)} />}
          <IconButton
            label={t('optionsRemovePattern', pattern.value)}
            icon={<CloseIcon />}
            onClick={() => void remove(props, pattern, offerRevoke)}
          />
        </li>
      ))}
    </ul>
  );
}
