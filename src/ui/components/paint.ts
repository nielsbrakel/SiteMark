const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Sets a user color (a mark color) as a custom property through the CSSOM. There is no `style`
 * attribute to prerender, so the website CSP needs no 'unsafe-inline', and anything that isn't a
 * `#rrggbb` hex is ignored (colors only as validated hex).
 */
export function paintColor(
  element: HTMLElement | null,
  property: `--sm-${string}`,
  color: string,
): void {
  if (element && HEX.test(color)) element.style.setProperty(property, color);
}
