import type { ReactNode } from 'react';

type ExternalLinkProps = { href: string; className?: string | undefined; children: ReactNode };

/** A link that leaves the website: no opener and no referrer go with it. */
export function ExternalLink({ href, className, children }: ExternalLinkProps) {
  return (
    <a href={href} className={className} rel="noopener noreferrer">
      {children}
    </a>
  );
}
