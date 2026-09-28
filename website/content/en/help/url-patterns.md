---
title: URL patterns
description: Tell a site group which pages it marks, with wildcards or regular expressions.
order: 2
---

A site group marks every page that one of its URL patterns matches. Patterns come in two kinds: wildcard patterns for everyday use, and regular expressions for special cases.

## Wildcard patterns

A wildcard pattern looks like a web address: `scheme://host/path`. A `*` stands for any run of characters.

- `https://example.com/*` matches every page on example.com over HTTPS.
- `*://example.com/*` matches both HTTP and HTTPS.
- `*.example.com` matches example.com and all its subdomains, such as `shop.example.com`.
- `example.com/admin/*` matches only the admin section.
- `localhost:3000` matches that port only. Without a port, any port matches.

You can leave out the scheme and the path: `example.com` means `*://example.com/*`. Without a `*` at the end, a path must match exactly, so `/admin` is not the same as `/admin/`. The query string is ignored unless the pattern contains a `?`.

SiteMark refuses patterns that would match far too much, such as a lone `*` host or `*.com`. That keeps both the marks and the permissions to the sites you mean.

## Regular expressions

For cases wildcards can't express, a pattern can be a regular expression. It is tested against the full address, and only on the origins you list with it, so SiteMark never needs access to every site. To keep your browser fast, SiteMark accepts only a safe subset: no backreferences, no lookarounds and no nested repetition.

## Exclude patterns and the tester

Exclude patterns switch a site group off for some pages, for example production except its status page. Below the patterns, the URL tester shows whether an address matches, and which pattern or exclude decided it.
