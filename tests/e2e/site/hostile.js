// Hostile fixture (REQ-SEC-006). Runs in the page's main world, before the body is parsed:
//  1. plants its own <sitemark-root> elements (SiteMark must never look its host up in the DOM),
//  2. removes every unknown child of <html> in a MutationObserver loop (re-attach is rate-limited),
//  3. closes every open popover in a timer loop (re-promotion is rate-limited),
//  4. breaks main-world prototypes, which the content script's isolated world never sees.
// Counters live in window.hostileStats for the tests to read.
window.hostileStats = { removals: 0, hides: 0 };

const planted = document.createElement('sitemark-root');
planted.id = 'planted-top';
planted.setAttribute('popover', 'manual');
planted.textContent = 'Planted host';
document.documentElement.append(planted);

const knownTags = new Set(['HEAD', 'BODY']);
const isKnown = (node) => node === planted || knownTags.has(node.nodeName);

function removeUnknown() {
  for (const node of [...document.documentElement.children]) {
    if (isKnown(node)) continue;
    node.remove();
    window.hostileStats.removals += 1;
  }
}

new MutationObserver(removeUnknown).observe(document.documentElement, { childList: true });

setInterval(() => {
  for (const element of document.querySelectorAll(':popover-open')) {
    element.hidePopover();
    window.hostileStats.hides += 1;
  }
}, 50);

Element.prototype.attachShadow = () => {
  throw new Error('attachShadow is disabled on this page');
};
