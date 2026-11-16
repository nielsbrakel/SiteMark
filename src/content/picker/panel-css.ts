/**
 * The mini panel (docs/design.md §5.3): a ~320 px paper card in the picker's shadow root. It
 * carries `.sm-theme`, so the scoped tokens (picker-host.ts) follow its `data-theme`
 * (REQ-THEME-001). A real focus ring everywhere; forced colors fall back to system colors.
 */
export const PANEL_CSS = `
.sm-panel {
  position: fixed;
  box-sizing: border-box;
  width: min(380px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  overflow: auto;
  /* The left padding clears the margin line. */
  padding: var(--sm-space-4) var(--sm-space-4) var(--sm-space-4) 40px;
  border: 2px solid var(--sm-control-border);
  border-radius: var(--sm-radius-lg);
  background: var(--sm-paper);
  box-shadow: var(--sm-lift);
  color: var(--sm-text);
  font: var(--sm-text-md)/1.4 var(--sm-font);
  color-scheme: light dark;
}
.sm-panel::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 28px;
  width: 2px;
  background: var(--sm-accent);
  opacity: 0.7;
}
.sm-panel[data-corner^='top'] {
  top: 16px;
}
.sm-panel[data-corner^='bottom'] {
  bottom: 16px;
}
.sm-panel[data-corner$='left'] {
  left: 16px;
}
.sm-panel[data-corner$='right'] {
  right: 16px;
}
.sm-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sm-space-2);
  margin-bottom: var(--sm-space-3);
}
.sm-panel__icon {
  min-width: 32px;
  min-height: 32px;
  border: 1.5px solid var(--sm-control-border);
  border-radius: var(--sm-radius-sm);
  background: var(--sm-surface-2);
  box-shadow: var(--sm-lift-sm);
  color: var(--sm-text);
  font: inherit;
  cursor: pointer;
}
.sm-panel *,
.sm-panel *::before {
  box-sizing: border-box;
}
.sm-panel__title {
  margin: 0;
  font: var(--sm-text-xl) var(--sm-font-display);
}
.sm-panel__row {
  display: grid;
  gap: var(--sm-space-1);
  margin-bottom: var(--sm-space-3);
}
.sm-panel__label {
  color: var(--sm-text-muted);
  font-size: var(--sm-text-sm);
}
.sm-panel__input,
.sm-panel__select {
  width: 100%;
  min-height: 32px;
  padding: var(--sm-space-1) var(--sm-space-2);
  border: 1.5px solid var(--sm-control-border);
  border-radius: var(--sm-radius-sm);
  background: var(--sm-surface-2);
  box-shadow: var(--sm-well);
  color: var(--sm-text);
  font: inherit;
}
.sm-panel__input {
  font-family: var(--sm-font-mono);
}
.sm-panel__match {
  color: var(--sm-text-muted);
  font-size: var(--sm-text-sm);
}
.sm-panel__swatches,
.sm-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sm-space-2);
}
.sm-panel__wave {
  display: block;
  width: 100%;
  height: 6px;
  margin-top: var(--sm-space-3);
  color: var(--sm-control-border);
  opacity: 0.55;
}
.sm-panel__switches {
  display: grid;
}
.sm-panel__switch,
.sm-panel__button {
  min-height: 32px;
  padding: var(--sm-space-1) var(--sm-space-3);
  border: 1.5px solid var(--sm-control-border);
  border-radius: var(--sm-radius-sm);
  background: var(--sm-surface-2);
  box-shadow: var(--sm-lift-sm);
  color: var(--sm-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
/* A switch row has no box of its own: the label on the left, the track on the right. */
.sm-panel__switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sm-space-1) 0;
  border-color: transparent;
  background: none;
  box-shadow: none;
  font-weight: 400;
  text-align: start;
}
.sm-panel__switch[aria-checked='true'] {
  font-weight: 600;
}
.sm-panel__track {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 62px;
  height: 28px;
  padding: 0 var(--sm-space-2);
  border: 1.5px solid var(--sm-control-border);
  border-radius: var(--sm-radius-pill);
  background: var(--sm-soft);
  color: var(--sm-text);
  font-size: var(--sm-text-xs);
  font-weight: 600;
  line-height: 1;
}
.sm-panel__track::after {
  content: '';
  position: absolute;
  inset: 3px auto auto 3px;
  width: 18px;
  height: 18px;
  border-radius: var(--sm-radius-pill);
  background: var(--sm-control-border);
  transition: transform calc(var(--sm-duration) * 2) var(--sm-spring);
}
.sm-panel__switch[aria-checked='true'] .sm-panel__track {
  justify-content: flex-start;
  background: var(--sm-tape-3);
  color: var(--sm-on-tape);
}
.sm-panel__switch[aria-checked='true'] .sm-panel__track::after {
  transform: translateX(34px);
}
.sm-panel__swatch {
  appearance: none;
  width: 28px;
  height: 28px;
  margin: 0;
  border: 2px solid var(--sm-control-border);
  border-radius: 50%;
  background: var(--sm-swatch);
  forced-color-adjust: none;
  cursor: pointer;
}
/* The selection is a ring; focus is an outline around it, so both show at once (WCAG 2.4.7). */
.sm-panel__swatch:checked {
  box-shadow:
    0 0 0 2px var(--sm-surface),
    0 0 0 5px var(--sm-text);
}
.sm-panel__swatch:focus-visible {
  outline: 2px solid var(--sm-focus-color);
  outline-offset: 6px;
}
.sm-panel__actions {
  justify-content: flex-end;
}
.sm-panel__notice {
  margin: 0 0 var(--sm-space-3);
  color: var(--sm-warning);
  font-weight: 600;
}
.sm-panel__button--link {
  margin-right: auto;
  padding-inline: 0;
  border-color: transparent;
  background: none;
  box-shadow: none;
  white-space: nowrap;
  color: var(--sm-accent-text);
}
.sm-panel__button--primary {
  background: var(--sm-accent);
  color: var(--sm-on-accent);
}
.sm-panel__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.sm-panel :focus-visible:not(.sm-panel__swatch) {
  outline: 2px solid var(--sm-focus-color);
  outline-offset: 2px;
}
@media (forced-colors: active) {
  .sm-panel {
    border: 1px solid CanvasText;
  }
  .sm-panel__button,
  .sm-panel__track {
    border-color: ButtonBorder;
  }
  .sm-panel__switch[aria-checked='true'] .sm-panel__track {
    background: Highlight;
    color: HighlightText;
  }
  .sm-panel__track::after {
    background: ButtonText;
  }
}
`;
