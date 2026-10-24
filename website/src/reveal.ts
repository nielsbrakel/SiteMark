/**
 * Marks every taped sheet `data-seen` the first time it scrolls into view, which starts the tape's
 * animation (base.css holds it paused until then). Browsers without IntersectionObserver show them all.
 */
export function revealOnView(doc: Document): void {
  const sheets = [...doc.querySelectorAll<HTMLElement>('.sm-tape')];
  const see = (sheet: HTMLElement) => sheet.setAttribute('data-seen', '');
  if (typeof IntersectionObserver === 'undefined') {
    sheets.forEach(see);
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      see(entry.target as HTMLElement);
      observer.unobserve(entry.target);
    }
  });
  for (const sheet of sheets) observer.observe(sheet);
}
