import { notImplemented } from '@/core/not-implemented';

export type HelpTopic =
  | 'getting-started'
  | 'url-patterns'
  | 'marks-and-effects'
  | 'picking-an-element'
  | 'hiding-marks-and-shortcuts'
  | 'permissions'
  | 'import-and-export'
  | 'troubleshooting';

export function helpTopics(): readonly HelpTopic[] {
  return notImplemented();
}
