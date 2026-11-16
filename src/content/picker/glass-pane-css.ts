/**
 * The glass pane (docs/design.md §5.3, D-301): an invisible cover, the neutral two-tone solid outline
 * (3 px `--sm-picker-dark` inside 3 px `--sm-picker-light`, readable on any background) with a soft
 * coral tint and two tape corners, a bordered paper tag and the hint note. Colors come from the
 * scoped tokens (picker-host.ts).
 */
export const GLASS_PANE_CSS = `
.sm-pane {
  position: fixed;
  inset: 0;
  cursor: crosshair;
  background: transparent;
  outline: none;
}
.sm-outline {
  position: fixed;
  box-sizing: border-box;
  pointer-events: none;
  border: 3px solid var(--sm-picker-dark);
  outline: 3px solid var(--sm-picker-light);
  background: rgb(232 102 77 / 14%);
  forced-color-adjust: none;
}
.sm-outline::before {
  top: -10px;
  left: -16px;
}
.sm-outline::after {
  right: -16px;
  bottom: -10px;
}
.sm-outline::before,
.sm-outline::after {
  content: '';
  position: absolute;
  width: 44px;
  height: 16px;
  background: var(--sm-tape-2) var(--sm-tape-stripes);
  opacity: 0.9;
  transform: rotate(-40deg);
}
.sm-tooltip {
  position: fixed;
  padding: 2px 10px;
  border: 1.5px solid var(--sm-control-border);
  border-radius: var(--sm-radius-sm);
  background: var(--sm-surface);
  box-shadow: var(--sm-lift-sm);
  color: var(--sm-text);
  font: var(--sm-text-sm)/1.4 var(--sm-font);
  pointer-events: none;
  max-width: min(480px, calc(100vw - 16px));
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.sm-hint {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  max-width: calc(100vw - 32px);
  padding: 4px 14px;
  border: 2px solid var(--sm-control-border);
  border-radius: var(--sm-radius-sm);
  background: var(--sm-surface);
  box-shadow: var(--sm-lift);
  color: var(--sm-text);
  font: var(--sm-text-sm)/1.4 var(--sm-font);
  pointer-events: none;
  text-align: center;
  /* Wraps rather than cutting off the keyboard instructions at 320 px or 400 % zoom (WCAG 1.4.10). */
  white-space: normal;
}
.sm-live {
  position: fixed;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
`;
