import { repositoryFileUrl, repositoryUrl } from './repository';

/** Where people reach the project: GitHub only (D-248). */
export type ContactUrls = {
  bugReport: string;
  featureRequest: string;
  securityReport: string;
  securityPolicy: string;
};

/** The contact routes, the same URLs as .github/SUPPORT.md and SECURITY.md (REQ-PAGE-003). */
export function contactUrls(): ContactUrls {
  const repository = repositoryUrl();
  return {
    bugReport: `${repository}/issues/new?template=bug_report.yml`,
    featureRequest: `${repository}/issues/new?template=feature_request.yml`,
    securityReport: `${repository}/security/advisories/new`,
    securityPolicy: repositoryFileUrl('SECURITY.md'),
  };
}
