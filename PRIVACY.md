# Privacy policy

Last updated: 2026-09-26

This policy covers the **SiteMark browser extension** and the **SiteMark website**
(nielsbrakel.github.io/SiteMark). It is also available in Dutch.

## In short

- SiteMark doesn't collect any data. It has no accounts, no analytics and no servers of its own.
- Your site groups and settings stay in your browser, in the extension's local storage.
- The website sets no cookies, loads nothing from other websites and only remembers your theme choice.
- Contact goes through GitHub only. There is no email address.

## Who is responsible

SiteMark is an open-source project made by **Niels Brakel, the Netherlands**, who is the controller for this
policy. SiteMark is maintained in spare time and isn't a company.

## The extension

### No data is collected

SiteMark doesn't collect, send, sell or share any data. It makes no network requests of its own, loads no
remote code and contains no analytics, tracking or crash reporting. The only exception is the favicon image
request described below, which goes to the website you are visiting and only when you turn it on.

### What stays in your browser

Your site groups, URL patterns, marks and settings are stored in the extension's `storage.local` area in your
browser. They are never stored in `storage.sync`, so your browser doesn't copy them to its cloud account.
If stored data can't be read, SiteMark keeps up to three backup copies next to it, also in `storage.local`.
Uninstalling SiteMark removes all of it, and so does **Reset everything** on the options page.

### Permissions and why SiteMark needs them

| Permission                               | Why                                                                                                                                                                               |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                | To keep your site groups and settings in `storage.local`.                                                                                                                         |
| `scripting`                              | To show marks on the pages that match your URL patterns.                                                                                                                          |
| `activeTab`                              | To pick an element or mark a site on the tab you are using, only after you click SiteMark or use its shortcut.                                                                    |
| Access to websites (`*://*/*`, optional) | Never granted at install. When you add a URL pattern, SiteMark asks for access to that website only, and it only runs on websites you granted. You can revoke access at any time. |

SiteMark reads a page only to find the elements you picked and to draw its marks. It doesn't read or store
what's on the page.

### The favicon image request

The favicon tint is **off by default**. When you turn it on for a mark, SiteMark loads the favicon of the
page you are visiting to draw a colored dot on it. That image request goes to the website itself (or wherever
that website keeps its icon), just like when your browser shows the tab. SiteMark sends nothing else with it.

### Web pages can detect marks

Marks are drawn inside the pages you visit. A website can notice that they are there, and could in theory
hide, move or copy them. SiteMark prevents mistakes; it isn't a security control. The in-page element picker
panel is also part of the page, so the website can see what you type into it.

### The title prefix and your browser history

If you turn on a title prefix (such as `[PROD]`), it becomes part of the tab title. Your browser saves page
titles in its history, so the prefix can end up there too, and in anything that syncs or reads that history.

### Export files

An export file contains your site groups and URL patterns, which may include internal hostnames. The file is
only saved where you choose. Treat it as internal data before you share it.

### Copy diagnostics

**Copy diagnostics** copies the SiteMark version, your browser, the permission status and mark status to your
clipboard, with website origins but no full URLs. It goes nowhere unless you paste it, for example into a
bug report.

### Browser stores

You install SiteMark from a browser store (Chrome Web Store, Microsoft Edge Add-ons, Firefox Add-ons, and the
App Store from v1.1). The store processes your installation under its own privacy policy. Stores can show the
maintainer aggregate numbers such as the number of users; these don't identify you.

## The website

### No cookies, analytics or third parties

The website sets no cookies and has no analytics, trackers, embedded content, web fonts or content delivery
networks. Every file comes from the website itself. Links to GitHub and the browser stores only take you there
when you click them.

### Your theme choice

If you choose Light or Dark with the theme switch, the website remembers that choice in your browser's local
storage under the key `sitemark-website:theme`. Choosing Auto removes it. Nothing else is stored, and the choice
never leaves your browser.

### Hosting by GitHub Pages

The website is hosted by GitHub Pages. Like any web server, GitHub receives your IP address and the usual
request details when you visit, and may keep them in its server logs, for example for security. SiteMark has
no access to those logs. GitHub describes this in the
[GitHub General Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

### GitHub Issues are public

Questions and bug reports go through GitHub Issues. Issues are public, and GitHub's own terms and privacy
statement apply to them. Don't put internal hostnames or other private details in an issue.

## Your rights

Under the GDPR you can ask what personal data is processed about you, and ask to correct or delete it.
SiteMark holds no personal data about you, so there is nothing to hand over or delete. Data in your browser is
under your control, and GitHub handles requests about GitHub accounts, issues and server logs. You can also
complain to the Dutch data protection authority (Autoriteit Persoonsgegevens).

## Contact

- Questions about this policy: open an issue at <https://github.com/nielsbrakel/SiteMark/issues>.
- Anything sensitive, such as a security problem: use private vulnerability reporting at
  <https://github.com/nielsbrakel/SiteMark/security/advisories/new> (see [SECURITY.md](SECURITY.md)).

## Changes to this policy

When SiteMark changes what it does with data, this policy changes first and the date at the top is updated.
Every change is visible in the history of this file in the repository.
