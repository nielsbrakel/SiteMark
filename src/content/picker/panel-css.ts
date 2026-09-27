/**
 * The mini panel (docs/design.md §5.3): a ~320 px neumorphic card in the picker's shadow root. It
 * carries `.sm-theme`, so the scoped tokens (picker-host.ts) follow its `data-theme`
 * (REQ-THEME-001). A real focus ring everywhere; forced colors fall back to system colors.
 */
export const PANEL_CSS = `
.sm-panel {
  position: fixed;
  box-sizing: border-box;
  width: min(340px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  overflow: auto;
  padding: var(--sm-space-4);
  border-radius: var(--sm-radius-lg);
  background: var(--sm-surface);
  box-shadow: var(--sm-raised);
  color: var(--sm-text);
  font: var(--sm-text-md)/1.4 var(--sm-font);
  color-scheme: light dark;
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
  border: 1px solid transparent;
  border-radius: 50%;
  background: var(--sm-surface);
  box-shadow: var(--sm-raised-sm);
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
  font-size: var(--sm-text-lg);
  font-weight: 600;
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
  border: 1px solid var(--sm-control-border);
  border-radius: var(--sm-radius-sm);
  background: var(--sm-bg);
  box-shadow: var(--sm-inset);
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
.sm-panel__chips,
.sm-panel__swatches,
.sm-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sm-space-2);
}
.sm-panel__chip,
.sm-panel__button {
  min-height: 32px;
  padding: var(--sm-space-1) var(--sm-space-3);
  border: 1px solid transparent;
  border-radius: var(--sm-radius-pill);
  background: var(--sm-surface);
  box-shadow: var(--sm-raised-sm);
  color: var(--sm-text);
  font: inherit;
  cursor: pointer;
}
.sm-panel__chip[aria-pressed='true'] {
  background: var(--sm-accent-soft);
  box-shadow: var(--sm-pressed);
  color: var(--sm-accent-text);
  font-weight: 600;
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
.sm-panel__swatch:checked {
  outline: 3px solid var(--sm-text);
  outline-offset: 2px;
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
  box-shadow: none;
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
.sm-panel :focus-visible {
  outline: 2px solid var(--sm-focus-color);
  outline-offset: 2px;
}
@media (forced-colors: active) {
  .sm-panel {
    border: 1px solid CanvasText;
  }
  .sm-panel__chip,
  .sm-panel__button {
    border-color: ButtonBorder;
  }
  .sm-panel__chip[aria-pressed='true'] {
    background: Highlight;
    color: HighlightText;
  }
}
`;
