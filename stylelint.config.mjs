// CSS rules (D-236, REQ-THEME-002): every color, background and shadow comes from a design token,
// so themes, forced colors and the contrast test (T-028) all see the same values.
const systemColors =
  /^(Canvas|CanvasText|LinkText|VisitedText|ActiveText|ButtonFace|ButtonText|ButtonBorder|Field|FieldText|Highlight|HighlightText|SelectedItem|SelectedItemText|Mark|MarkText|GrayText|AccentColor|AccentColorText)$/;

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': [
      'rgb',
      'rgba',
      'hsl',
      'hsla',
      'hwb',
      'lab',
      'lch',
      'oklab',
      'oklch',
      'color',
    ],
    'declaration-property-value-allowed-list': {
      '/^(color|background|background-color|border(-(top|right|bottom|left))?-color|outline-color|fill|stroke|caret-color|accent-color|box-shadow|text-shadow)$/':
        [/var\(--sm-/, 'transparent', 'currentColor', 'inherit', 'none', systemColors],
    },
    // Global primitives use BEM-ish `sm-` names; CSS Modules use camelCase (no prefix needed).
    'selector-class-pattern': [
      '^(sm-[a-z0-9]+(-[a-z0-9]+)*(__[a-z0-9-]+)?(--[a-z0-9-]+)?|[a-z][a-zA-Z0-9]*)$',
      { message: 'Use sm-block__element--modifier globally, camelCase in CSS Modules' },
    ],
    // CSS Modules reach the theme attributes on <html> through :global(…) (D-236).
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],
  },
  overrides: [
    {
      // The only place raw color values may live.
      files: ['src/styles/tokens.css'],
      rules: {
        'color-no-hex': null,
        'color-named': null,
        'function-disallowed-list': null,
        'declaration-property-value-allowed-list': null,
      },
    },
  ],
};
