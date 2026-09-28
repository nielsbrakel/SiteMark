/**
 * The glass pane (docs/design.md §5.3): an invisible cover, the neutral two-tone dashed outline
 * (2 px `--sm-picker-dark` dashes inside 2 px `--sm-picker-light`, readable on any background) and
 * a raised tooltip pill. Colors come from the scoped tokens (picker-host.ts).
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
  border: 2px dashed var(--sm-picker-dark);
  outline: 2px solid var(--sm-picker-light);
  forced-color-adjust: none;
}
.sm-tooltip {
  position: fixed;
  max-width: min(480px, calc(100vw - 16px));
  overflow: hidden;
  padding: 4px 10px;
  border-radius: var(--sm-radius-pill);
  background: var(--sm-surface);
  box-shadow: var(--sm-raised-sm);
  color: var(--sm-text);
  font: 12px/1.5 var(--sm-font);
  white-space: nowrap;
  text-overflow: ellipsis;
  pointer-events: none;
}
.sm-hint {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  max-width: calc(100vw - 32px);
  padding: 6px 14px;
  border-radius: var(--sm-radius-pill);
  background: var(--sm-surface);
  box-shadow: var(--sm-raised-sm);
  color: var(--sm-text);
  font: 12px/1.5 var(--sm-font);
  text-align: center;
  /* Wraps rather than cutting off the keyboard instructions at 320 px or 400 % zoom (WCAG 1.4.10). */
  white-space: normal;
  pointer-events: none;
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
