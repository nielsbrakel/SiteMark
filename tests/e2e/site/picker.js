// Picker isolation fixture (REQ-PICK-003). Runs in the page's main world and counts every page
// handler a pick could trigger: element handlers (onclick, pointerdown, mousedown, focus, keydown)
// and window capture listeners. A window capture listener runs before anything else in the page,
// so it also sees input aimed at SiteMark's own host; it counts only input that reaches a page
// element. window.pickerStats.reset() starts over.
const zero = () => ({
  click: 0,
  pointerdown: 0,
  mousedown: 0,
  focus: 0,
  keydown: 0,
  windowCapture: 0,
  navigated: 0,
});
window.pickerStats = { ...zero(), reset: () => Object.assign(window.pickerStats, zero()) };
const count = (name) => () => {
  window.pickerStats[name] += 1;
};

for (const id of ['field', 'danger', 'link']) {
  const element = document.getElementById(id);
  element.onclick = count('click');
  element.addEventListener('pointerdown', count('pointerdown'));
  element.addEventListener('mousedown', count('mousedown'));
  element.addEventListener('focus', count('focus'));
  element.addEventListener('keydown', count('keydown'));
}

const isSiteMark = (target) =>
  target instanceof Element && target.localName.startsWith('sitemark-');
for (const type of ['pointerdown', 'mousedown', 'click', 'keydown', 'focusin']) {
  window.addEventListener(
    type,
    (event) => {
      if (!isSiteMark(event.target)) count('windowCapture')();
    },
    true,
  );
}
window.addEventListener('hashchange', count('navigated'));
