import { browser } from 'wxt/browser';
import type { PaneLabels } from './highlight';
import type { PanelLabels } from './panel-fields';

// The picker's texts from browser.i18n: no translator, to keep the injected bundle small.

/** The glass pane's texts. */
export function paneLabels(): PaneLabels {
  const { i18n } = browser;
  return {
    frameNote: i18n.getMessage('pickerFrameNote'),
    componentNote: i18n.getMessage('pickerComponentNote'),
    paneName: i18n.getMessage('pickerPaneName'),
    hint: i18n.getMessage('pickerHint'),
    size: (width, height) => i18n.getMessage('pickerSize', [String(width), String(height)]),
  };
}

/** The mini panel's texts. */
export function panelLabels(): PanelLabels {
  const { i18n } = browser;
  return {
    title: i18n.getMessage('pickerPanelTitle'),
    selector: i18n.getMessage('pickerSelectorLabel'),
    matchOne: i18n.getMessage('pickerMatchOne'),
    matchNone: i18n.getMessage('pickerMatchNone'),
    matchInvalid: i18n.getMessage('pickerMatchInvalid'),
    matchMany: (count) => i18n.getMessage('pickerMatchMany', [String(count)]),
    siteGroup: i18n.getMessage('pickerSiteGroupLabel'),
    newSiteGroup: (origin) => i18n.getMessage('pickerNewSiteGroup', [origin]),
    effects: i18n.getMessage('pickerEffectsLabel'),
    effectNames: {
      ribbon: i18n.getMessage('pickerEffectRibbon'),
      outline: i18n.getMessage('pickerEffectOutline'),
      tint: i18n.getMessage('pickerEffectTint'),
      stripes: i18n.getMessage('pickerEffectStripes'),
    },
    color: i18n.getMessage('pickerColorLabel'),
    colorNames: {
      red: i18n.getMessage('pickerColorRed'),
      amber: i18n.getMessage('pickerColorAmber'),
      blue: i18n.getMessage('pickerColorBlue'),
      slate: i18n.getMessage('pickerColorSlate'),
    },
    save: i18n.getMessage('pickerSave'),
    cancel: i18n.getMessage('pickerCancel'),
    moreOptions: i18n.getMessage('pickerMoreOptions'),
    movePanel: i18n.getMessage('pickerMovePanel'),
  };
}
