import { expect, it } from 'vitest';
import type { HelpTopic } from '@/lib/site-links';
import {
  helpTopics,
  type HelpTopic as WebsiteHelpTopic,
} from '../../website/src/routes/help-topics';

// Fails to compile when the website drops or renames a topic the extension links to.
const onTheWebsite = (topic: HelpTopic): WebsiteHelpTopic => topic;

it('REQ-POP-008 REQ-OPT-008 every help topic the extension links exists on the website', () => {
  expect(helpTopics()).toContain(onTheWebsite('troubleshooting'));
});
