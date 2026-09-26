/**
 * Adds style sheets to a shadow root. Constructed sheets can't be blocked by the page's CSP, so they
 * come first; where the content-script world can't adopt them (Firefox bug 1751346) the same CSS
 * goes into `<style>` elements instead (D-232).
 */
export function adoptStyles(shadow: ShadowRoot, cssTexts: readonly string[]): void {
  if (cssTexts.length === 0 || tryAdopt(shadow, cssTexts)) return;
  for (const css of cssTexts) {
    const style = document.createElement('style');
    style.textContent = css;
    shadow.append(style);
  }
}

function tryAdopt(shadow: ShadowRoot, cssTexts: readonly string[]): boolean {
  try {
    const sheets = cssTexts.map((css) => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      return sheet;
    });
    shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, ...sheets];
    return sheets.every((sheet) => shadow.adoptedStyleSheets.includes(sheet));
  } catch {
    return false;
  }
}
