/**
 * Outline: a line in the mark color 2 px outside the target's box; the view sets its width.
 * The pulse is a 1.6 s glow, off under prefers-reduced-motion (REQ-MARK-003, REQ-A11Y-005).
 */
export const OUTLINE_CSS = `
.sm-outline {
  outline: 2px solid var(--sm-mark-color);
  outline-offset: 2px;
}
.sm-outline[data-style='dashed'] {
  outline-style: dashed;
}
.sm-outline[data-style='dotted'] {
  outline-style: dotted;
}
.sm-outline[data-pulse] {
  animation: sm-outline-pulse 1.6s ease-in-out infinite;
}
@keyframes sm-outline-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
  50% {
    box-shadow: 0 0 12px 6px color-mix(in srgb, var(--sm-mark-color) 60%, transparent);
  }
}
@media (prefers-reduced-motion: reduce) {
  .sm-outline[data-pulse] {
    animation: none;
  }
}
`;
