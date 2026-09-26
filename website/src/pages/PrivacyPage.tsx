import { Markdown } from '../content/markdown';
import { policyFor } from '../content/policy';
import type { PageProps } from './page-props';

/**
 * The privacy policy (REQ-POLICY-001): PRIVACY.md on /privacy/ and PRIVACY.nl.md on /nl/privacy/,
 * rendered at build time. Its own `# ` heading is the page's h1, and its "Last updated" line shows
 * the date (REQ-POLICY-004).
 */
export function PrivacyPage({ locale }: PageProps) {
  const { source, file } = policyFor(locale);
  return <Markdown source={source} file={file} />;
}
